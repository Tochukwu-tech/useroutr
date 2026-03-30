"use client";

import { format } from "date-fns";

interface SuccessCardProps {
  amount: number;
  currency?: string;
  merchantName: string;
  referenceId: string;
  paymentDate?: Date | string;
  receiptEmail?: string;
}

export function SuccessCard({
  amount,
  currency = "USD",
  merchantName,
  referenceId,
  paymentDate,
  receiptEmail,
}: SuccessCardProps) {
  const formattedAmount = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
  }).format(amount);

  const formattedDate = paymentDate
    ? typeof paymentDate === "string"
      ? format(new Date(paymentDate), "MMM d, yyyy 'at' h:mm a")
      : format(paymentDate, "MMM d, yyyy 'at' h:mm a")
    : format(new Date(), "MMM d, yyyy 'at' h:mm a");

  return (
    <div className="space-y-4">
      {/* Amount display */}
      <div className="rounded-lg bg-muted/50 p-6 text-center">
        <p className="text-sm text-muted-foreground">Total amount</p>
        <p className="mt-2 font-mono text-2xl font-semibold text-foreground">
          {formattedAmount}
        </p>
      </div>

      {/* Transaction details */}
      <div className="space-y-3 rounded-lg bg-muted/30 p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">To</span>
          <span className="text-sm font-medium text-foreground">
            {merchantName}
          </span>
        </div>
        <div className="h-px bg-border" />
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Reference</span>
          <span className="font-mono text-xs text-foreground">
            {referenceId}
          </span>
        </div>
        <div className="h-px bg-border" />
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Date</span>
          <span className="text-xs text-foreground">{formattedDate}</span>
        </div>
      </div>

      {/* Receipt email notification */}
      {receiptEmail && (
        <div className="rounded-lg border border-green/20 bg-green/5 p-3">
          <p className="text-xs text-muted-foreground">
            A receipt has been sent to{" "}
            <span className="font-medium text-foreground">{receiptEmail}</span>
          </p>
        </div>
      )}
    </div>
  );
}