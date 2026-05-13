export const Colors = {
  background: '#0A0A14',
  surface: '#12121F',
  surfaceRaised: '#1A1A2E',
  border: '#2A2A3E',

  primary: '#7C5CFC',
  primaryLight: '#A688FD',
  primaryDim: '#3D2E7E',

  accent: '#FC5CA8',
  accentDim: '#7E2E54',

  success: '#4ECDC4',
  warning: '#FFE66D',
  danger: '#FF6B6B',

  text: '#F0F0F8',
  textSecondary: '#9090B8',
  textMuted: '#5A5A7A',

  // Category colors
  social: '#FC5CA8',
  entertainment: '#FF6B6B',
  productivity: '#4ECDC4',
  health: '#7BC86C',
  education: '#FFE66D',
  games: '#7C5CFC',
  communication: '#56C1FF',
  news: '#F4A261',
  other: '#9090B8',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const Typography = {
  hero: { fontSize: 32, fontWeight: '700' as const, lineHeight: 40 },
  h1: { fontSize: 24, fontWeight: '700' as const, lineHeight: 32 },
  h2: { fontSize: 20, fontWeight: '600' as const, lineHeight: 28 },
  h3: { fontSize: 17, fontWeight: '600' as const, lineHeight: 24 },
  body: { fontSize: 15, fontWeight: '400' as const, lineHeight: 22 },
  bodySmall: { fontSize: 13, fontWeight: '400' as const, lineHeight: 19 },
  caption: { fontSize: 11, fontWeight: '500' as const, lineHeight: 16 },
  label: { fontSize: 12, fontWeight: '600' as const, lineHeight: 16, letterSpacing: 0.8 },
};
