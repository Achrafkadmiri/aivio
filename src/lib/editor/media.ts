/**
 * Getting a generated clip into a shape the canvas can draw.
 *
 * Three problems are solved here, and they are the reason the studio needs
 * this layer at all rather than pointing a `<video>` at `resultUrl`:
 *
 *  1. **Tainting.** A canvas that has drawn a cross-origin frame refuses to
 *     hand its pixels back. Every source therefore goes through the
 *     same-origin proxy at /api/studio/media — see that route for why the
 *     obvious `crossOrigin="anonymous"` does not work against R2.
 *  2. **Seeking.** The export seeks the same file hundreds of times. Over
 *     the network that is hundreds of range requests; from a Blob in memory
 *     it is instant. So each source is downloaded once, whole, and every
 *     clip cut from it plays off the same object URL.
 *  3. **Expiry.** `resultUrl` is a short-lived signed link. Caching by
 *     generation id rather than by URL means a project reopened tomorrow
 *     re-signs and re-fetches without ever finding a stale entry.
 */

export function studioMediaUrl(signedUrl: string): string {
  return `/api/studio/media?url=${encodeURIComponent(signedUrl)}`;
}

const sources = new Map<string, Promise<string>>();

/**
 * The object URL for a generation's video, downloading it on first ask.
 *
 * Concurrent callers share one in-flight download — the timeline adds three
 * clips off the same source and they must not each pull 8MB. A failure
 * evicts the entry so a retry is possible; a resolved one is kept for the
 * whole session, since the user is very likely to reuse the clip.
 */
export function loadSource(sourceId: string, signedUrl: string): Promise<string> {
  const existing = sources.get(sourceId);
  if (existing) return existing;

  const promise = (async () => {
    const res = await fetch(studioMediaUrl(signedUrl));
    if (!res.ok) throw new Error("That clip could not be loaded for editing.");
    return URL.createObjectURL(await res.blob());
  })();

  promise.catch(() => sources.delete(sourceId));
  sources.set(sourceId, promise);
  return promise;
}

/** The downloaded bytes again, for the audio mixdown — `decodeAudioData`
 *  wants an ArrayBuffer, and re-fetching would double the traffic. */
export async function sourceArrayBuffer(objectUrl: string): Promise<ArrayBuffer> {
  const res = await fetch(objectUrl);
  return await res.arrayBuffer();
}

export function releaseAllSources() {
  for (const entry of sources.values()) {
    entry.then((url) => URL.revokeObjectURL(url)).catch(() => {});
  }
  sources.clear();
}

export type ProbeResult = { duration: number; width: number; height: number };

/**
 * Reads a clip's real length and pixel size.
 *
 * Needed before a clip can be added at all: the trim handles, the timeline
 * block width and the fit maths all depend on it, and `parameters.duration`
 * on the generation is what was *requested*, which providers routinely miss
 * by a fraction of a second.
 *
 * The `Infinity` guard is for fragmented MP4s, where metadata alone does not
 * carry a duration — seeking far past the end forces the browser to work it
 * out from the media itself.
 */
export function probeVideo(objectUrl: string): Promise<ProbeResult> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;

    const done = (result: ProbeResult) => {
      video.removeAttribute("src");
      video.load();
      resolve(result);
    };

    video.onloadedmetadata = () => {
      if (video.duration === Infinity) {
        video.currentTime = 1e6;
        video.ontimeupdate = () => {
          video.ontimeupdate = null;
          done({
            duration: video.duration,
            width: video.videoWidth,
            height: video.videoHeight,
          });
        };
        return;
      }
      done({ duration: video.duration, width: video.videoWidth, height: video.videoHeight });
    };
    video.onerror = () => reject(new Error("That clip could not be decoded."));
    video.src = objectUrl;
  });
}

/**
 * A `<video>` the renderer can draw from.
 *
 * Never attached to the document: it exists purely as a decode target. Muted
 * because the mixdown handles audio separately and an autoplaying element
 * with sound would be blocked outright; `playsInline` because iOS otherwise
 * takes any played video fullscreen.
 */
export function createDecodeVideo(objectUrl: string): HTMLVideoElement {
  const video = document.createElement("video");
  video.src = objectUrl;
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";
  video.crossOrigin = "anonymous";
  return video;
}

/** How far a playing preview may drift from the playhead before it is
 *  yanked back. Generous — correcting a 60ms drift costs a re-seek, which
 *  looks far worse than the drift did. */
export const PREVIEW_DRIFT_TOLERANCE = 0.22;

/**
 * Parks a video on an exact frame.
 *
 * Resolves on `seeked`, which is the only event that means the decoded frame
 * for the requested time is actually the one `drawImage` will get. Reading
 * the canvas without waiting for it is the classic way to end up with an
 * export where every frame is one clip behind.
 *
 * The timeout is a safety valve, not an expectation: some browsers never
 * fire `seeked` for a time inside the last partial frame of a file, and an
 * export must not hang forever on the final frame of a clip.
 */
export function seekTo(video: HTMLVideoElement, time: number, timeoutMs = 4000): Promise<void> {
  const target = Math.max(0, Math.min(time, Math.max(0, (video.duration || 0) - 0.001)));

  // Already there — re-seeking would still cost a decode round trip.
  if (Math.abs(video.currentTime - target) < 0.001 && video.readyState >= 2) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      video.removeEventListener("seeked", finish);
      clearTimeout(timer);
      resolve();
    };
    const timer = setTimeout(finish, timeoutMs);
    video.addEventListener("seeked", finish);
    video.currentTime = target;
  });
}

/** Resolves once the element has enough data to be drawn at all. */
export function waitForReady(video: HTMLVideoElement, timeoutMs = 15000): Promise<void> {
  if (video.readyState >= 2) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Timed out loading a clip.")), timeoutMs);
    const ok = () => {
      clearTimeout(timer);
      video.removeEventListener("loadeddata", ok);
      video.removeEventListener("error", fail);
      resolve();
    };
    const fail = () => {
      clearTimeout(timer);
      video.removeEventListener("loadeddata", ok);
      video.removeEventListener("error", fail);
      reject(new Error("A clip failed to load."));
    };
    video.addEventListener("loadeddata", ok);
    video.addEventListener("error", fail);
  });
}

/**
 * One decode element per clip, not per source.
 *
 * Two clips cut from the same generation need independent playheads — a
 * shared element would make trimming one of them scrub the other. The pool
 * is keyed by clip id and reconciled against the project on every change, so
 * a deleted clip's decoder is released instead of quietly holding a video
 * buffer for the rest of the session.
 */
export class VideoPool {
  private elements = new Map<string, HTMLVideoElement>();

  ensure(clipId: string, objectUrl: string): HTMLVideoElement {
    const existing = this.elements.get(clipId);
    if (existing && existing.src === objectUrl) return existing;
    existing?.removeAttribute("src");
    const video = createDecodeVideo(objectUrl);
    this.elements.set(clipId, video);
    return video;
  }

  get(clipId: string): HTMLVideoElement | null {
    return this.elements.get(clipId) ?? null;
  }

  /** Drops decoders for clips that are no longer in the project. */
  retain(clipIds: Set<string>) {
    for (const [id, video] of this.elements) {
      if (clipIds.has(id)) continue;
      video.pause();
      video.removeAttribute("src");
      video.load();
      this.elements.delete(id);
    }
  }

  pauseAll() {
    for (const video of this.elements.values()) video.pause();
  }

  dispose() {
    this.retain(new Set());
  }
}
