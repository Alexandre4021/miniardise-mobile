/**
 * Couleurs et pictogrammes des catégories — repris du thème « MiniarDise Or » 1.2.4
 * (inc/icons.php et « Couleurs par catégorie » de theme.css). Ordre = barre de catégories du site.
 */

export interface CategoryStyle {
  bg: string;
  accent: string;
  text: string;
  label: string;
  /** Contenu SVG (viewBox 0 0 48 48, trait currentColor). */
  icon: string;
}

export const CATEGORY_ORDER = ["pignon", "pistache", "noisette", "amandes", "noix", "pate", "melange", "graines", "preparation-patisserie"] as const;

export const CATEGORY_STYLES: Record<string, CategoryStyle> = {
  "pignon": { bg: '#F2E3BD', accent: '#9A722B', text: '#634812', label: "Pignon", icon: "<path d=\"M24 6c5.6 5.4 8.6 12.4 8.6 20 0 9-3.9 15-8.6 16-4.7-1-8.6-7-8.6-16 0-7.6 3-14.6 8.6-20z\"/><path d=\"M24 6c-1.4 2.6-2 5.4-1.8 8.4\" /><path d=\"M27.2 18c1.5 3 2.2 6.4 2 10\" fill=\"currentColor\" fill-opacity=\".18\"/>" },
  "pistache": { bg: '#D5E8A4', accent: '#557D16', text: '#33490D', label: "Pistache", icon: "<path d=\"M24 5c8.5 3.2 13.5 12.4 12.2 21.6C35 35.4 30 42 24 43c-6-1-11-7.6-12.2-16.4C10.5 17.4 15.5 8.2 24 5z\"/><path d=\"M24 5c-3.2 6-4.4 13-3.8 20 .5 6.6 1.8 12.6 3.8 18\" /><path d=\"M27 15c2.6 3.4 3.7 8 3.3 12.6-.3 4-1.6 7.4-3.5 9.6\" fill=\"currentColor\" fill-opacity=\".18\"/><path d=\"M15.5 30.5c2 1.6 4 2.4 6 2.6M14.5 23c2.2 1.4 4.3 2 6.2 2\"/>" },
  "noisette": { bg: '#EBCCA9', accent: '#7D4F22', text: '#52310E', label: "Noisette", icon: "<path d=\"M24 7v4\"/><path d=\"M10.5 22.5C12 15.5 17.5 11 24 11s12 4.5 13.5 11.5c-4-1.6-8.5-2.4-13.5-2.4s-9.5.8-13.5 2.4z\" fill=\"currentColor\" fill-opacity=\".18\"/><path d=\"M12 23.2c-.7 1.6-1 3.3-1 5 0 8 5.8 14.3 13 14.3s13-6.3 13-14.3c0-1.7-.3-3.4-1-5\"/><path d=\"M19 30c1 3.5 3 5.5 5 6\"/>" },
  "amandes": { bg: '#F3DCC0', accent: '#A06A35', text: '#6C431B', label: "Amande", icon: "<path d=\"M24 4.5c7.8 6.3 13 15.6 13 23.6 0 8.6-5.9 15.4-13 15.4S11 36.7 11 28.1c0-8 5.2-17.3 13-23.6z\"/><path d=\"M24 11c-3.2 6.8-4.4 14.2-3.4 25\" /><path d=\"M17.5 25.5l.01 0M28.5 22.5l.01 0M30 31l.01 0M18.5 33.5l.01 0M26.5 37l.01 0\" stroke-width=\"2.6\"/>" },
  "noix": { bg: '#E3D3BF', accent: '#654730', text: '#45301E', label: "Noix", icon: "<path d=\"M24 6c10 0 17 7.5 17 18s-7 18-17 18S7 34.5 7 24 14 6 24 6z\"/><path d=\"M24 6c-2.5 3.5-2.5 7 0 10.5s2.5 7 0 10.5-2.5 7 0 10.5c1 1.4 1 3 0 4.5\"/><path d=\"M13 16c2.4 1.2 3.6 3 3.6 5.4M12 28c2.6-.4 4.6.4 6 2.4M17 37c.4-2 1.8-3.4 4-4M35 16c-2.4 1.2-3.6 3-3.6 5.4M36 28c-2.6-.4-4.6.4-6 2.4M31 37c-.4-2-1.8-3.4-4-4\"/>" },
  "pate": { bg: '#E8C9B5', accent: '#73402A', text: '#52291A', label: "Pâte", icon: "<rect x=\"12\" y=\"9\" width=\"24\" height=\"6\" rx=\"2\"/><path d=\"M13.5 15h21v21a5 5 0 0 1-5 5h-11a5 5 0 0 1-5-5V15z\"/><path d=\"M13.5 24c3.5-2.4 7-2.4 10.5 0s7 2.4 10.5 0\" fill=\"currentColor\" fill-opacity=\".18\"/><path d=\"M31 5.5l-4 12\" />" },
  "melange": { bg: '#F5CFD3', accent: '#A12C3B', text: '#73202C', label: "Mélange", icon: "<ellipse cx=\"17\" cy=\"19\" rx=\"7\" ry=\"9.5\" transform=\"rotate(-25 17 19)\"/><path d=\"M14 14c2.2 3.2 3 6.6 2.4 10\" /><circle cx=\"31.5\" cy=\"17.5\" r=\"6.5\"/><path d=\"M31.5 11v13\" /><path d=\"M14.5 33c3.8-4 10.4-4.4 14.4-.8 2.2 2 2.4 5 .6 6.8-1.6 1.6-4 1.4-5.6.2-2-1.6-4.4-1.8-6.4-.2-1.8 1.4-4.2 1-5-.8-.6-1.6.4-3.6 2-5.2z\" fill=\"currentColor\" fill-opacity=\".18\"/>" },
  "graines": { bg: '#D3E3C4', accent: '#43702F', text: '#2E4A1B', label: "Graines", icon: "<ellipse cx=\"17\" cy=\"20\" rx=\"5.5\" ry=\"8\" transform=\"rotate(-20 17 20)\"/><ellipse cx=\"31\" cy=\"19\" rx=\"5.5\" ry=\"8\" transform=\"rotate(20 31 19)\" fill=\"currentColor\" fill-opacity=\".18\"/><ellipse cx=\"24\" cy=\"33\" rx=\"5.5\" ry=\"8\" /><path d=\"M17 12l1.5-3M31 11l-1.5-3M24 25v-3\"/>" },
  "preparation-patisserie": { bg: '#F6E0A9', accent: '#9C701A', text: '#664810', label: "Préparation pâtisserie", icon: "<path d=\"M24 28v15\" /><path d=\"M24 28c-7-3-10-10-8.6-16.2C16.4 7.4 20 5 24 5s7.6 2.4 8.6 6.8C34 18 31 25 24 28z\"/><path d=\"M24 28c-3.4-3.4-4.8-9.6-4-15 .5-3.8 2-6.6 4-8 2 1.4 3.5 4.2 4 8 .8 5.4-.6 11.6-4 15z\"/><path d=\"M24 5v23\" /><rect x=\"21.5\" y=\"34\" width=\"5\" height=\"9\" rx=\"2.5\" fill=\"currentColor\" fill-opacity=\".18\"/>" },
};

/** Style par défaut (or MiniarDise) pour une catégorie hors barre. */
export const DEFAULT_CATEGORY_STYLE: CategoryStyle = {
  bg: '#F6EDD7', accent: '#A67C27', text: '#84601A', label: '', icon: CATEGORY_STYLES.pistache.icon,
};

export function categoryStyle(slug: string): CategoryStyle {
  return CATEGORY_STYLES[slug] ?? DEFAULT_CATEGORY_STYLE;
}

export function categoryRank(slug: string): number {
  const i = (CATEGORY_ORDER as readonly string[]).indexOf(slug);
  return i === -1 ? CATEGORY_ORDER.length : i;
}

export function categorySvg(icon: string): string {
  return `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${icon}</svg>`;
}
