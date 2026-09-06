import { PublicCollectionClient } from "@/components/collections/public-collection-client";
import { PageGuide } from "@/components/help/page-guide";

export default async function PublicCollectionPage(props: PageProps<"/c/[token]">) {
  const { token } = await props.params;
  return (
    <>
      <PublicCollectionClient token={token} />
      {/* This route sits outside every group layout, so it mounts its own. */}
      <PageGuide variant="floating" />
    </>
  );
}
