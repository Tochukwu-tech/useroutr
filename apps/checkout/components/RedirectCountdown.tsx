"use client";

import { useEffect, useState } from "react";

interface RedirectCountdownProps {
  redirectUrl: string;
  seconds?: number;
}

export function RedirectCountdown({
  redirectUrl,
  seconds = 5,
}: RedirectCountdownProps) {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    if (remaining <= 0) {
      window.location.href = redirectUrl;
      return;
    }

    const interval = setInterval(() => {
      setRemaining((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [remaining, redirectUrl]);

  const progress = ((seconds - remaining) / seconds) * 100;

  return (
    <div className="space-y-3">
      <p className="text-center text-sm text-muted-foreground">
        Redirecting in {remaining}s...
      </p>
      <div className="h-1 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}