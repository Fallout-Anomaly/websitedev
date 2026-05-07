import { redirect } from "next/navigation";

export default async function LegacyWorkbooksSlugRedirect({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(`/staff/sheets/${slug}`);
}
