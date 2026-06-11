import '@testing-library/jest-dom/vitest';
import dayjs from 'dayjs';
import 'dayjs/locale/es';

// Match the app's global locale so date-picker / chart formatting behaves like production.
dayjs.locale('es');

// jsdom does not implement matchMedia, which MUI's useMediaQuery (and our hooks) rely on.
if (!window.matchMedia) {
  window.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    addListener: () => undefined,
    removeListener: () => undefined,
    dispatchEvent: () => false,
  }) as unknown as MediaQueryList;
}

// jsdom does not implement ResizeObserver, which MUI X charts and the DataGrid use to size
// themselves. A no-op keeps those components from throwing during render tests.
if (!('ResizeObserver' in globalThis)) {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}
