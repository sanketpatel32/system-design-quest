import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/react'
import './index.css'
import App from './App.tsx'
import { authEnabled, CLERK_KEY } from './lib/auth/clerk'

// Bright Duolingo-style look for Clerk's modal: our green, Nunito, chunky radius
const appearance = {
  variables: { colorPrimary: '#58cc02', colorText: '#29303d', fontFamily: 'Nunito, system-ui, sans-serif', borderRadius: '14px' },
  elements: { formButtonPrimary: { fontWeight: 800, textTransform: 'uppercase' as const, letterSpacing: '0.04em', boxShadow: '0 4px 0 #46a302' } },
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {authEnabled ? (
      <ClerkProvider publishableKey={CLERK_KEY} appearance={appearance} afterSignOutUrl="/">
        <App />
      </ClerkProvider>
    ) : (
      <App />
    )}
  </StrictMode>,
)
