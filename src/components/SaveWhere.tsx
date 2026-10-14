import { useAuth } from '@clerk/react'
import { authEnabled } from '../lib/auth/clerk'

const GUEST = { eyebrow: 'Saved in this browser', text: "You're playing as a guest, so progress lives in this browser's storage. Sign in to save it to your account and pick up on any device, or keep a backup before clearing site data." }
const LOCAL_ONLY = { eyebrow: 'Stored only in this browser', text: "Your progress lives in this browser's local storage. Nothing is sent to a server, so keep a backup before clearing site data or switching browsers." }
const SIGNED_IN = { eyebrow: 'Saved to your account', text: 'Your progress is saved on this device and synced to your account, so it follows you when you sign in elsewhere. Backups still work if you want a copy.' }

function WithAuth({ children }: { children: (c: typeof GUEST) => React.ReactNode }) {
  const { isSignedIn } = useAuth()
  return <>{children(isSignedIn ? SIGNED_IN : GUEST)}</>
}

/** Where progress is saved, worded for guests, signed-in players, and builds without sign-in */
export function SaveWhere({ children }: { children: (c: typeof GUEST) => React.ReactNode }) {
  return authEnabled ? <WithAuth>{children}</WithAuth> : <>{children(LOCAL_ONLY)}</>
}
