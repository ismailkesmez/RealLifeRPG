import { useAppContext } from '../context/AppContext';

export const palette = {
  dark: {
    bg:           '#0d0d1a',
    card:         '#16162a',
    cardAlt:      '#13132b',
    border:       '#2a2a4a',
    borderLight:  '#1e1e38',
    text:         '#e0e0ff',
    textSub:      '#a0a0cc',
    textMuted:    '#555577',
    textFaint:    '#444466',
    inputBg:      '#1e1e3a',
  },
  light: {
    bg:           '#f0f0f8',
    card:         '#ffffff',
    cardAlt:      '#f8f8ff',
    border:       '#dcdcee',
    borderLight:  '#ececf8',
    text:         '#111122',
    textSub:      '#444455',
    textMuted:    '#888899',
    textFaint:    '#aaaacc',
    inputBg:      '#f0f0ff',
  },
};

export const accent = {
  primary:  '#7b61ff',
  primaryBg:'#7b61ff22',
  success:  '#4ade80',
  successBg:'#4ade8033',
  danger:   '#ff6b6b',
  dangerBg: '#ff6b6b15',
};

export function useColors() {
  const { theme } = useAppContext();
  return { ...palette[theme] ?? palette.dark, accent, isDark: theme === 'dark' };
}
