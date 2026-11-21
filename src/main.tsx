import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/react'
import './index.css'
import { initCatalog } from './content/catalog'
import { authEnabled, CLERK_KEY } from './lib/auth/clerk'

// Clerk's modal in our look. Clerk derives its shades from real colour values, so these mirror
// --color-hero-deep, --color-chalk and --color-hero-shadow in index.css (the button fill that carries white text)
const appearance = {
  variables: { colorPrimary: '#2f7d00', colorText: '#29303d', fontFamily: 'Nunito, system-ui, sans-serif', borderRadius: '14px' },
  elements: { formButtonPrimary: { fontWeight: 900, fontSize: '1rem', textTransform: 'none' as const, letterSpacing: '0', boxShadow: '0 4px 0 #1f5600' } },
}

// Load the catalog chunk and the app code in parallel: every module that reads
// catalog data at eval time (sections, numbering, pages) is behind the dynamic App
// import, which only evaluates after initCatalog resolves.
void Promise.all([initCatalog(), import('./App')]).then(([, { default: App }]) => {
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
})
