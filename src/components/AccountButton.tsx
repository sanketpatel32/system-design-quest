import { Show, SignInButton, UserButton } from '@clerk/react'
import { authEnabled } from '../lib/auth/clerk'

/** Header sign-in / account control. Renders nothing when Clerk isn't configured. */
export function AccountButton() {
  if (!authEnabled) return null
  return (
    <>
      <Show when="signed-out">
        <SignInButton mode="modal">
          <button type="button" className="btn-cta btn-signin" data-testid="sign-in">
            Sign in
          </button>
        </SignInButton>
      </Show>
      <Show when="signed-in">
        <span className="grid h-10 w-10 place-items-center">
          <UserButton appearance={{ elements: { avatarBox: { width: 36, height: 36 } } }} />
        </span>
      </Show>
    </>
  )
}
