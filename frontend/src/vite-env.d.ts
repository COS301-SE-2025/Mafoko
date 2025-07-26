/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AUTH_SERVICE_URL: string
  readonly VITE_SEARCH_SERVICE_URL: string
  readonly VITE_ANALYTICS_SERVICE_URL: string
  readonly VITE_LINGUIST_APP_SERVICE_URL: string
  readonly VITE_VOTE_SERVICE_URL: string
  readonly VITE_GLOSSARY_SERVICE_URL: string
  readonly VITE_WORKSPACE_SERVICE_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
