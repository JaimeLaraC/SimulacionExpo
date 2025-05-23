export const colors = {
  primary: '#007AFF', // A modern blue, good for interactive elements, headers
  secondary: '#34C759', // A vibrant green for positive changes, success
  accent: '#FF3B30',   // A strong red for negative changes, errors, warnings
  background: '#F2F2F7', // Standard iOS-like light grey background
  surface: '#FFFFFF',    // White for card backgrounds, modal backgrounds
  textPrimary: '#000000', // Pure black for main text
  textSecondary: '#6E6E73', // Grey for less important text, subtitles
  border: '#D1D1D6',       // Light grey for borders and dividers
  placeholder: '#C7C7CD', // Placeholder text color
  disabled: '#A1A1A1',    // For disabled elements
};

export const typography = {
  // For now, we'll use the system font. 
  // To use a custom font, you'd need to load it into the Expo project.
  // fontFamily: 'YourCustomFont-Regular', 
  fontFamily: undefined, // Defaults to system font

  h1: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  h2: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  h3: {
    fontSize: 18,
    fontWeight: '600', // Semi-bold for h3
  },
  body: {
    fontSize: 16,
    fontWeight: 'normal',
  },
  caption: {
    fontSize: 12,
    fontWeight: 'normal',
  },
  button: {
    fontSize: 16,
    fontWeight: 'bold',
  }
};

export const spacing = {
  xxs: 2,
  xs: 4,
  s: 8,
  m: 16,
  l: 24,
  xl: 32,
  xxl: 40,
};

// Example of a common card style
export const cardStyle = {
  backgroundColor: colors.surface,
  borderRadius: 10,
  padding: spacing.m,
  marginVertical: spacing.s,
  marginHorizontal: spacing.s, // Default horizontal margin for cards
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.1,
  shadowRadius: 3,
  elevation: 2, // For Android
  borderWidth: Platform.OS === 'android' ? 0 : 1, // Thinner border for iOS, or none for Android if elevation is used
  borderColor: colors.border,
};

// Example of a common input style
export const inputStyle = {
  height: 50,
  backgroundColor: colors.surface,
  borderColor: colors.border,
  borderWidth: 1,
  borderRadius: 8,
  paddingHorizontal: spacing.m,
  fontSize: typography.body.fontSize,
  color: colors.textPrimary,
  marginBottom: spacing.m,
};

// Import Platform for platform-specific styles if needed
import { Platform } from 'react-native';
