import { useEffect } from 'react';

export const useKeyboardShortcuts = () => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Ctrl+K or Cmd+K: Focus global search
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        const globalSearch = document.getElementById('global-search');
        if (globalSearch) {
          (globalSearch as HTMLInputElement).focus();
          (globalSearch as HTMLInputElement).select();
        }
      }

      // 2. /: Focus local search (if not already typing in an input)
      if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        const localSearch = document.getElementById('local-search') || document.getElementById('global-search');
        if (localSearch) {
          (localSearch as HTMLInputElement).focus();
          (localSearch as HTMLInputElement).select();
        }
      }

      // 3. Escape: Blur active input/textarea
      if (e.key === 'Escape') {
        if (
          document.activeElement?.tagName === 'INPUT' ||
          document.activeElement?.tagName === 'TEXTAREA'
        ) {
          (document.activeElement as HTMLElement).blur();
        }
      }

      // 4. Alt+P: Trigger print button
      if (e.altKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        const printTrigger = document.getElementById('print-trigger');
        if (printTrigger) {
          (printTrigger as HTMLElement).click();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
};
export default useKeyboardShortcuts;
