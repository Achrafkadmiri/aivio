import { PublicCollectionClient } from "@/components/collections/public-collection-client";

export default async function PublicCollectionPage(props: PageProps<"/c/[token]">) {
  const { token } = await props.params;
  return <PublicCollectionClient token={token} />;
}
