/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_WS_URL: string;
  readonly VITE_APP_NAME: string;
  readonly VITE_DEFAULT_CITY: string;
  readonly VITE_DEFAULT_LAT: string;
  readonly VITE_DEFAULT_LNG: string;
  readonly VITE_TILE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
