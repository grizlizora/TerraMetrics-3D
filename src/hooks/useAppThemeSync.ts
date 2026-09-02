import { useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';

export function useAppThemeSync() {
  const theme = useAppStore((s) => s.theme);

  useEffect(() => {
    // Synchronize HTML dark class with theme
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Synchronize Native StatusBar style
    import('@capacitor/status-bar')
      .then(({ StatusBar, Style }) => {
        StatusBar.setStyle({ style: theme === 'dark' ? Style.Dark : Style.Light }).catch(() => {});
      })
      .catch(() => {});
  }, [theme]);
}
