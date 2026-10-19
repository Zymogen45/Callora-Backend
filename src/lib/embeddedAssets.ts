/**
 * Assets embedded into the single-file serverless bundle (see
 * scripts/build-vercel.mjs). When the app runs from the regular `dist/` build
 * or via tsx these are undefined and callers fall back to reading from disk.
 */
export interface EmbeddedAssets {
  /** Raw contents of docs/openapi.json. */
  openapi?: string;
  /** SQL migration files keyed by file name. */
  migrations?: Record<string, string>;
}

export function getEmbeddedAssets(): EmbeddedAssets | undefined {
  return (globalThis as { __CALLORA_ASSETS__?: EmbeddedAssets }).__CALLORA_ASSETS__;
}
