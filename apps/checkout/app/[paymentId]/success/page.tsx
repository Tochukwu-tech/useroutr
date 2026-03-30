import { SuccessPageClient } from "@/components/SuccessPageClient";

export default function SuccessPage({
  params,
}: {
  params: Promise<{ paymentId: string }>;
}) {
  return <SuccessPageClient params={params} />;
}