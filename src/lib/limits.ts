/** Shared request limits. Kept zod-free so client components can import them
 * without bundling zod (whose eval feature check trips the CSP). */
export const MAX_NAME_LENGTH = 120;
export const MAX_BATCH_SIZE = 200;
