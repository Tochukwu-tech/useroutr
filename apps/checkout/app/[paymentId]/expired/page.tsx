import { ExpiredPageClient } from "@/components/ExpiredPageClient";

export default function ExpiredPage({
  params,
}: {
  params: Promise<{ paymentId: string }>;
}) {
  return <ExpiredPageClient params={params} />;
}