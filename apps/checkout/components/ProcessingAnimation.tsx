"use client";

interface ProcessingAnimationProps {
  message?: string;
}

export function ProcessingAnimation({ message }: ProcessingAnimationProps) {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative flex h-12 w-12 items-center justify-center">
        {/* Outer pulsing ring */}
        <div className="absolute inset-0 rounded-full bg-primary/20 animate-pulse" />
        {/* Inner circle with subtle animation */}
        <div className="relative h-8 w-8 rounded-full bg-primary/30">
          <div className="absolute inset-1 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      </div>
      {message && (
        <p className="text-center text-sm text-muted-foreground">{message}</p>
      )}
    </div>
  );
}