import { ClerkLoading, Show, SignInButton, UserButton, useUser } from '@clerk/react'
import { authEnabled } from '../lib/auth/clerk'
import { displayNameFor } from '../lib/auth/displayName'
import { CloudSync, SyncIndicator } from './CloudSync'

/** Header sign-in / account control. Renders nothing when Clerk isn't configured. */
export function AccountButton() {
  if (!authEnabled) return null
  return (
    <>
      <ClerkLoading>
        <span className="account-skeleton" aria-hidden data-testid="account-loading" />
      </ClerkLoading>
      <Show when="signed-out">
        <SignInButton mode="modal">
          <button type="button" className="btn-cta btn-signin" data-testid="sign-in">
            Sign in
          </button>
        </SignInButton>
      </Show>
      <CloudSync />
      <Show when="signed-in">
        <SyncIndicator />
        <SignedInUser />
      </Show>
    </>
  )
}

function SignedInUser() {
  const { user } = useUser()
  const name = displayNameFor(user)
  return (
    <span className="account-chip">
      {name && (
        <span data-testid="display-name" className="hidden md:inline max-w-[10rem] truncate pl-2 text-sm font-extrabold text-chalk" title={name}>
          {name}
        </span>
      )}
      <span className="grid h-10 w-10 place-items-center">
        <UserButton appearance={{ elements: { avatarBox: { width: 36, height: 36 } } }}>
          <UserButton.MenuItems>
            <UserButton.Action label={`Playing as ${name || 'you'}`} labelIcon={<span aria-hidden>🎮</span>} onClick={() => {}} />
          </UserButton.MenuItems>
        </UserButton>
      </span>
    </span>
  )
}
