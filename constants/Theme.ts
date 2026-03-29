export const Colors = {
  primary: '#0EA5E9',
  background: '#16304C', // Lighter blue-gray background
  surface: '#234566',    // Matching lighter surface
  text: '#F8FAFC',
  textMuted: '#94A3B8',
  border: 'rgba(14, 165, 233, 0.2)',
  glow: 'rgba(14, 165, 233, 0.25)',
  white: '#FFFFFF',
  blackCharcoal: '#1A1C1E', // Replaced black with black charcoal
};

export const Theme = {
  colors: Colors,
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 24, // As per specs
  },
  typography: {
    heading: 'PlusJakartaSans-Bold',
    body: 'Inter-Regular',
    bodyMedium: 'Inter-Medium',
    bodyBold: 'Inter-Bold',
  },
};
