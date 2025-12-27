/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// Google API Key from Replit Secrets
declare const GOOGLE_API_KEY: string;
