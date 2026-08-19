"use client";

import { useState } from "react";
import { GenericImageToVideoForm } from "./generic-image-to-video-form";
import { DynamicModelForm } from "./dynamic-model-form";
import { getCloudflareModel } from "@/lib/cloudflare-models";
import { VIDEO_MODELS, type VideoModelId } from "@/lib/constants";

export function ImageToVideoForm({
  onCreated,
  busy,
}: {
  onCreated: (jobId: string) => void;
  busy: boolean;
}) {
  const [model, setModel] = useState<VideoModelId>(VIDEO_MODELS[0].id);
  const dynamicConfig = getCloudflareModel(model);

  if (dynamicConfig && dynamicConfig.category === "image-to-video") {
    return (
      <DynamicModelForm
        key={model}
        config={dynamicConfig}
        mode="image-to-video"
        models={VIDEO_MODELS}
        model={model}
        onModelChange={setModel}
        initialPrompt=""
        onPromptChange={() => {}}
        onCreated={onCreated}
        busy={busy}
      />
    );
  }

  return (
    <GenericImageToVideoForm
      key={model}
      models={VIDEO_MODELS}
      model={model}
      onModelChange={setModel}
      onCreated={onCreated}
      busy={busy}
    />
  );
}
