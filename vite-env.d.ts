/// <reference types="vite/client" />

declare namespace NodeJS {
  interface ProcessEnv {
    readonly API_KEY: string;
    readonly GEMINI_API_KEY: string;
    readonly VITE_ENCRYPTION_KEY: string;
    readonly NODE_ENV: string;
  }
}

interface ImportMetaEnv {
  readonly API_KEY: string;
  readonly VITE_ENCRYPTION_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
