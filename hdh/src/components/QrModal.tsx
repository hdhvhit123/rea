"use client";

import { useEffect, useRef } from "react";
import { XIcon } from "./icons";

export function QrModal({ code, shortUrl, onClose }: { code: string; shortUrl: string; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
  }, []);
  const enc = encodeURIComponent(code);
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && ref.current?.close()}
      aria-labelledby="qr-title"
      className="m-auto w-[min(92vw,380px)] rounded-2xl border border-line bg-surface p-0 text-ink backdrop:bg-black/40"
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="qr-title" className="text-lg font-bold">QR code</h2>
            <p className="mt-0.5 break-all text-sm text-ink-2">{shortUrl.replace(/^https?:\/\//, "")}</p>
          </div>
          <button type="button" className="btn-ghost px-2" aria-label="Close" onClick={() => ref.current?.close()}>
            <XIcon />
          </button>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`/api/links/${enc}/qr?format=png&size=512`} alt={`QR code for ${shortUrl}`} width={256} height={256} className="mx-auto my-4 h-64 w-64 rounded-xl bg-white p-2" />
        <p className="mb-4 text-center text-xs text-ink-3">Scans are counted separately from clicks.</p>
        <div className="grid grid-cols-2 gap-2">
          <a className="btn-primary" href={`/api/links/${enc}/qr?format=png&size=1024&download=1`} download>Download PNG</a>
          <a className="btn-ghost" href={`/api/links/${enc}/qr?format=svg&download=1`} download>Download SVG</a>
        </div>
      </div>
    </dialog>
  );
}
