/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/** App version injected at build time from package.json (see vite.config define). */
declare const __APP_VERSION__: string;
