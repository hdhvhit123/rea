"use client";

import { useState } from "react";
import { copyText } from "@/lib/client";
import { CheckIcon, CopyIcon } from "./icons";

export function CopyButton({ text, label = "Copy", className = "btn-ghost btn-sm" }: { text: string; label?: string; className?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className={className}
      onClick={async () => {
        if (await copyText(text)) {
          setDone(true);
          setTimeout(() => setDone(false), 1600);
        }
      }}
      aria-live="polite"
    >
      {done ? <CheckIcon width={14} height={14} /> : <CopyIcon width={14} height={14} />}
      {done ? "Copied" : label}
    </button>
  );
}
