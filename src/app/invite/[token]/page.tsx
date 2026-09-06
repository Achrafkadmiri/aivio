import { InviteAcceptClient } from "@/components/invite/invite-accept-client";
import { PageGuide } from "@/components/help/page-guide";

// Plain Promise<{ token }> typing rather than this repo's usual
// PageProps<"/route/[param]"> helper — that type comes from Next's
// route-manifest codegen (.next/types), which only includes routes that
// already existed the last time `next dev`/`next build` ran, so a
// brand-new route like this one wouldn't resolve there until after a
// build. This is the plain, portable Next.js 15 async-params typing.
export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return (
    <>
      <InviteAcceptClient token={token} />
      {/* This route sits outside every group layout, so it mounts its own. */}
      <PageGuide variant="floating" />
    </>
  );
}
