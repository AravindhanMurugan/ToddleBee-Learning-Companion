/**
 * Semantic design tokens for the mobile app.
 *
 * These tokens mirror the naming conventions used in web artifacts (index.css)
 * so that multi-artifact projects share a cohesive visual identity.
 *
 * Replace the placeholder values below with values that match the project's
 * brand. If a sibling web artifact exists, read its index.css and convert the
 * HSL values to hex so both artifacts use the same palette.
 *
 * To add dark mode, add a `dark` key with the same token names.
 * The useColors() hook will automatically pick it up.
 */

const colors = {
  light: {
    text: '#102B50',
    tint: '#FFBF24',
    background: '#FFF9EC',
    foreground: '#102B50',
    card: '#FFFFFF',
    cardForeground: '#102B50',
    primary: '#FFBF24',
    primaryForeground: '#102B50',
    secondary: '#BDE7FF',
    secondaryForeground: '#102B50',
    muted: '#F7F0DE',
    mutedForeground: '#53657B',
    accent: '#75C99B',
    accentForeground: '#102B50',
    destructive: '#FF9278',
    destructiveForeground: '#102B50',
    border: '#E9DCC0',
    input: '#E9DCC0',
  },
  dark: {
    text: '#FFF9EC',
    tint: '#FFBF24',
    background: '#102B50',
    foreground: '#FFF9EC',
    card: '#17395E',
    cardForeground: '#FFF9EC',
    primary: '#FFBF24',
    primaryForeground: '#102B50',
    secondary: '#65B9DE',
    secondaryForeground: '#102B50',
    muted: '#1A446B',
    mutedForeground: '#B6C6D8',
    accent: '#75C99B',
    accentForeground: '#102B50',
    destructive: '#FF9278',
    destructiveForeground: '#102B50',
    border: '#345675',
    input: '#345675',
  },
  radius: 16,
};

export default colors;
