export type DesktopIconConfig = {
  id: string;
  label: string;
  href?: string;
  image: string;
  col: number;
  row: number;
};

const makeIcon = (id: string, label: string, letter: string, color: string, data: Partial<DesktopIconConfig> = {}) => {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='96' height='96' viewBox='0 0 96 96'><rect width='96' height='96' rx='18' fill='${color}'/><text x='50%' y='55%' dominant-baseline='middle' text-anchor='middle' font-family='Inter,Segoe UI,Arial' font-size='38' font-weight='600' fill='white'>${letter}</text></svg>`;
  return {
    id,
    label,
    image: `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`,
    href: data.href,
    col: data.col ?? 0,
    row: data.row ?? 0
  } satisfies DesktopIconConfig;
};

export const INITIAL_ICONS: DesktopIconConfig[] = [
  makeIcon("portfolio", "Portfolio", "P", "#4cc9f0", { href: "https://example.com", col: 0, row: 0 }),
  makeIcon("github", "GitHub", "G", "#ff6b6b", { href: "https://github.com", col: 1, row: 0 }),
  makeIcon("linkedin", "LinkedIn", "L", "#7b68ee", { href: "https://linkedin.com", col: 0, row: 1 }),
  makeIcon("contact", "Contact", "C", "#ffd166", { href: "mailto:hello@example.com", col: 1, row: 1 })
];
