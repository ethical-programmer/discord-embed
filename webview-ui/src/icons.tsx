import type { ReactNode } from 'react';

// A small inline icon set in the Lucide style (24px grid, 2px stroke),
// so the webview needs no icon dependency.

export interface IconProps {
  size?: number;
  className?: string;
}

export type Icon = (props: IconProps) => JSX.Element;

function icon(paths: ReactNode): Icon {
  return ({ size = 16, className }) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {paths}
    </svg>
  );
}

export const Plus = icon(<path d="M5 12h14M12 5v14" />);
export const Minus = icon(<path d="M5 12h14" />);
export const X = icon(<path d="M18 6 6 18M6 6l12 12" />);
export const Check = icon(<path d="M20 6 9 17l-5-5" />);
export const ChevronDown = icon(<path d="m6 9 6 6 6-6" />);

export const Copy = icon(
  <>
    <rect x="8" y="8" width="14" height="14" rx="2" />
    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
  </>
);

export const Code = icon(<path d="m16 18 6-6-6-6M8 6l-6 6 6 6" />);

export const Sun = icon(
  <>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
  </>
);

export const Moon = icon(<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />);

export const Monitor = icon(
  <>
    <rect x="2" y="3" width="20" height="14" rx="2" />
    <path d="M8 21h8M12 17v4" />
  </>
);

export const RotateCcw = icon(<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8M3 3v5h5" />);

export const Sparkles = icon(
  <>
    <path d="M9.94 15.5A2 2 0 0 0 8.5 14.06l-6.14-1.58a.5.5 0 0 1 0-.96L8.5 9.94A2 2 0 0 0 9.94 8.5l1.58-6.14a.5.5 0 0 1 .96 0L14.06 8.5A2 2 0 0 0 15.5 9.94l6.14 1.58a.5.5 0 0 1 0 .96L15.5 14.06a2 2 0 0 0-1.44 1.44l-1.58 6.14a.5.5 0 0 1-.96 0z" />
    <path d="M20 3v4M22 5h-4M4 17v2M5 18H3" />
  </>
);

export const Hash = icon(<path d="M4 9h16M4 15h16M10 3 8 21M16 3l-2 18" />);

export const User = icon(
  <>
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </>
);

export const CircleUser = icon(
  <>
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="10" r="3" />
    <path d="M7 20.66V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.66" />
  </>
);

export const Heading = icon(<path d="M6 12h12M6 20V4M18 20V4" />);
export const AlignLeft = icon(<path d="M15 12H3M17 18H3M21 6H3" />);

export const Columns = icon(
  <>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M12 3v18" />
  </>
);

export const ImageIcon = icon(
  <>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="9" cy="9" r="2" />
    <path d="m21 15-3.09-3.09a2 2 0 0 0-2.82 0L6 21" />
  </>
);

export const Thumbnail = icon(
  <>
    <rect x="14" y="4" width="7" height="7" rx="1.5" />
    <path d="M3 6h7M3 10h7M3 15h18M3 19h12" />
  </>
);

export const CircleDot = icon(
  <>
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="2" />
  </>
);

export const Type = icon(<path d="M4 7V4h16v3M9 20h6M12 4v16" />);

export const Clock = icon(
  <>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </>
);

export const MousePointerClick = icon(
  <>
    <path d="M14 4.1 12 6M5.1 8l-2.9-.8M6 12l-1.9 2M7.2 2.2 8 5.1" />
    <path d="M9.04 9.69a.5.5 0 0 1 .65-.65l11 4.5a.5.5 0 0 1-.07.95l-4.35 1.04a1 1 0 0 0-.74.74l-1.04 4.35a.5.5 0 0 1-.95.07z" />
  </>
);

export const Trash = icon(<path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />);

export const AlertTriangle = icon(
  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3ZM12 9v4M12 17h.01" />
);

export const CircleCheck = icon(
  <>
    <circle cx="12" cy="12" r="10" />
    <path d="m9 12 2 2 4-4" />
  </>
);

export const ImageOff = icon(
  <path d="m2 2 20 20M10.41 10.41a2 2 0 1 1-2.83-2.83M13.5 13.5 6 21M18 12l3 3M3.59 3.59A2 2 0 0 0 3 5v14a2 2 0 0 0 2 2h14c.55 0 1.05-.22 1.41-.59M21 15V5a2 2 0 0 0-2-2H9" />
);

export const ExternalLink = icon(
  <path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
);

export const EmbedIcon = icon(
  <>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="M7 8v8M11 9h6M11 13h4" />
  </>
);

export const ContainerIcon = icon(
  <>
    <rect x="3" y="3" width="18" height="18" rx="3" />
    <rect x="7" y="7" width="10" height="4" rx="1" />
    <path d="M7 15h10" />
  </>
);

export const SeparatorIcon = icon(<path d="M3 12h18M7 6h10M7 18h10" />);

export const SectionButton = icon(
  <>
    <path d="M3 7h11M3 11h8M3 15h9" />
    <rect x="15" y="9" width="6" height="6" rx="2" />
  </>
);

export const EyeOff = icon(
  <path d="M10.73 5.08A10.4 10.4 0 0 1 12 5c7 0 10 7 10 7a13.2 13.2 0 0 1-1.67 2.68M6.61 6.61A13.5 13.5 0 0 0 2 12s3 7 10 7a9.7 9.7 0 0 0 5.39-1.61M2 2l20 20M14.12 14.12a3 3 0 1 1-4.24-4.24" />
);

export const Bold = icon(<path d="M6 12h9a4 4 0 0 1 0 8H7a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h7a4 4 0 0 1 0 8" />);
export const Italic = icon(<path d="M19 4h-9M14 20H5M15 4 9 20" />);
export const Underline = icon(<path d="M6 4v6a6 6 0 0 0 12 0V4M4 20h16" />);
export const Strikethrough = icon(<path d="M16 4H9a3 3 0 0 0-2.83 4M14 12a4 4 0 0 1 0 8H6M4 12h16" />);
export const LinkIcon = icon(
  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
);
export const QuoteIcon = icon(<path d="M17 6H3M21 12H8M21 18H8M3 12v6" />);
export const ListIcon = icon(<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />);

export const Pencil = icon(
  <path d="M21.17 6.81a1 1 0 0 0-3.98-3.98L3.84 16.17a2 2 0 0 0-.5.83l-1.32 4.35a.5.5 0 0 0 .62.62l4.35-1.32a2 2 0 0 0 .83-.5zM15 5l4 4" />
);
