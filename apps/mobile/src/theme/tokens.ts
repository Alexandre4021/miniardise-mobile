/**
 * Design tokens MiniarDise Or — repris du thème WordPress « MiniarDise Or » 1.2.4
 * (assets/css/theme.css). Toute couleur de l'app passe par ici : aucune valeur en dur
 * dans les écrans.
 */
export const colors = {
  ink: '#1E1A12',
  ink2: '#3D3424',
  muted: '#6B5D42',
  gold: '#C49A3C',
  gold2: '#A67C27',
  goldText: '#84601A', // or lisible sur fond clair (contraste AA)
  goldLight: '#E6CD8A',
  champagne: '#F6EDD7',
  cream: '#FBF8F1',
  white: '#FFFFFF',
  line: '#E8DCBF',
  lineStrong: '#D6C290',
  sand: '#F1E4C2',
  success: '#2F6F3A',
  error: '#A8261D',
} as const;

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 } as const;

export const radius = { sm: 10, md: 16, pill: 999 } as const;

/** Cible tactile minimale (Apple HIG 44 pt). */
export const tapTarget = 44;

export const typography = {
  display: { fontSize: 28, lineHeight: 34, fontWeight: '700' },
  title: { fontSize: 20, lineHeight: 26, fontWeight: '700' },
  body: { fontSize: 16, lineHeight: 24, fontWeight: '400' },
  bodyStrong: { fontSize: 16, lineHeight: 24, fontWeight: '600' },
  small: { fontSize: 14, lineHeight: 20, fontWeight: '400' },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '500' },
} as const;

export type TypographyVariant = keyof typeof typography;
