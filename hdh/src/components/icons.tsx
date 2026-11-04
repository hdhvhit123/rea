import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;
const base = (p: P) => ({ width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true, ...p });

export const LinkIcon = (p: P) => (<svg {...base(p)}><path d="M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1.5 1.5" /><path d="M14 11a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1.5-1.5" /></svg>);
export const CopyIcon = (p: P) => (<svg {...base(p)}><rect x="9" y="9" width="12" height="12" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" /></svg>);
export const CheckIcon = (p: P) => (<svg {...base(p)}><path d="M20 6 9 17l-5-5" /></svg>);
export const ChartIcon = (p: P) => (<svg {...base(p)}><path d="M3 3v18h18" /><path d="M7 15l4-4 3 3 5-6" /></svg>);
export const QrIcon = (p: P) => (<svg {...base(p)}><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><path d="M14 14h3v3h-3zM20 14v.01M14 20h.01M17 20h4v-3" /></svg>);
export const LockIcon = (p: P) => (<svg {...base(p)}><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>);
export const ClockIcon = (p: P) => (<svg {...base(p)}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>);
export const ShieldIcon = (p: P) => (<svg {...base(p)}><path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z" /><path d="m9 12 2 2 4-4" /></svg>);
export const BoltIcon = (p: P) => (<svg {...base(p)}><path d="M13 2 4 14h7l-1 8 9-12h-7z" /></svg>);
export const EyeIcon = (p: P) => (<svg {...base(p)}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></svg>);
export const TagIcon = (p: P) => (<svg {...base(p)}><path d="M20 12 12 20l-9-9V3h8z" /><circle cx="7.5" cy="7.5" r="1.5" /></svg>);
export const UserIcon = (p: P) => (<svg {...base(p)}><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>);
export const MenuIcon = (p: P) => (<svg {...base(p)}><path d="M4 7h16M4 12h16M4 17h16" /></svg>);
export const XIcon = (p: P) => (<svg {...base(p)}><path d="M18 6 6 18M6 6l12 12" /></svg>);
export const ExternalIcon = (p: P) => (<svg {...base(p)}><path d="M14 4h6v6M20 4l-9 9M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5" /></svg>);
export const TrashIcon = (p: P) => (<svg {...base(p)}><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" /></svg>);
export const EditIcon = (p: P) => (<svg {...base(p)}><path d="M4 20h4L19 9l-4-4L4 16z" /></svg>);
export const SearchIcon = (p: P) => (<svg {...base(p)}><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>);
export const ChevronIcon = (p: P) => (<svg {...base(p)}><path d="m6 9 6 6 6-6" /></svg>);

export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 font-semibold tracking-[-0.03em] ${className}`}>
      <span className="grid h-8 w-8 place-items-center rounded-[9px] bg-[linear-gradient(140deg,var(--brand),oklch(60%_0.2_290))] text-white shadow-brand">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden>
          <path d="M6 5v14M6 12h6M12 9v10M18 5v14" />
        </svg>
      </span>
      <span className="text-[21px] leading-none">hdh</span>
    </span>
  );
}
export const ArrowIcon = (p: P) => (<svg {...base(p)}><path d="M5 12h14M13 6l6 6-6 6" /></svg>);
export const SlidersIcon = (p: P) => (<svg {...base(p)}><path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6" /></svg>);
export const CloudIcon = (p: P) => (<svg {...base(p)}><path d="M17.5 19H8a6 6 0 1 1 5.7-7.9A4.5 4.5 0 1 1 17.5 19z" /></svg>);
export const GridIcon = (p: P) => (<svg {...base(p)}><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>);
export const KeyIcon = (p: P) => (<svg {...base(p)}><circle cx="7.5" cy="15.5" r="4.5" /><path d="m10.7 12.3 9.3-9.3M16 7l3 3M19 4l2 2" /></svg>);
export const SparkIcon = (p: P) => (<svg {...base(p)}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6" /></svg>);
export const PhoneIcon = (p: P) => (<svg {...base(p)}><rect x="6" y="2" width="12" height="20" rx="2" /><path d="M11 18h2" /></svg>);
export const MonitorIcon = (p: P) => (<svg {...base(p)}><rect x="2" y="4" width="20" height="13" rx="2" /><path d="M8 21h8M12 17v4" /></svg>);
export const CardIcon = (p: P) => (<svg {...base(p)}><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="10" r="2" /><path d="M14 9h4M14 13h4M6 16h12" /></svg>);
export const BookIcon = (p: P) => (<svg {...base(p)}><circle cx="12" cy="12" r="9" /><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6V14M12 17h.01" /></svg>);
