/** Clerk is optional: with no publishable key the app runs as a guest-only game with localStorage progress. */
export const CLERK_KEY = (import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined)?.trim() || ''
export const authEnabled = CLERK_KEY.startsWith('pk_')
