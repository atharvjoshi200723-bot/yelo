/**
 * YELO Neo-Brutalist Sticker Design System Tokens
 * "Playful neo-brutalist sticker UI": Chunky, Gen-Z, fun, navy outlines, hard shadows.
 */

export const NEO_TOKENS = {
  colors: {
    bg: '#EAE4FB',          // lavender soft background
    bgLight: '#F5F2FF',     // soft gradient end
    purple: '#9A63E6',      // brand purple
    purpleLight: '#B79BF0', // soft purple
    cream: '#F6FBD4',       // primary card surface
    lime: '#C5F030',        // primary buttons, selected chips, active states
    orange: '#E8622B',      // accents, badges, candy ball
    teal: '#2FA3B5',        // accents, badges, candy ball
    yellow: '#FFD41F',      // title marker-highlight, stickers, candy ball
    pink: '#FF5C8A',        // likes/hearts, notification dots, live signal, badges
    approve: '#3F8A12',     // success/confirmed status
    deny: '#FF9A1F',        // alert/action warning
    navy: '#1B1250',        // ALL text, outlines, and hard shadows
    white: '#FFFFFF',       // floating notification cards only
    disabledLime: '#D8EDB0',
    disabledNavy: 'rgba(27, 18, 80, 0.4)',
    tabs: {
      home: '#FF5C8A',     // pink
      rent: '#E8622B',     // orange
      buddy: '#9A63E6',    // purple
      forums: '#2FA3B5',   // teal
      messages: '#FFD41F', // yellow
    },
  },
  borders: {
    navy3: '3px solid #1B1250',
    navy2: '2.5px solid #1B1250',
  },
  radii: {
    card: '26px',
    input: '20px',
    pill: '9999px',
    marker: '8px',
    modal: '26px',
  },
  shadows: {
    button: '4px 5px 0 #1B1250',
    card: '6px 8px 0 #1B1250',
    chip: '3px 3px 0 #1B1250',
    pressed: '1px 1px 0 #1B1250',
    modal: '8px 10px 0 #1B1250',
    floatingCard: '0 10px 30px -5px rgba(27, 18, 80, 0.12)',
  },
  typography: {
    headline: '"Rubik", "Bricolage Grotesque", -apple-system, sans-serif',
    body: '"Plus Jakarta Sans", -apple-system, sans-serif',
    handwritten: '"Caveat Brush", cursive',
    letterSpacingHeadline: '-0.03em',
    lineHeightHeadline: '1',
  },
  transitions: {
    spring: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
    springFast: 'all 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
} as const;
