export interface NameSource {
  firstName?: string | null
  lastName?: string | null
  username?: string | null
  publicMetadata?: Record<string, unknown> | null
  primaryEmailAddress?: { emailAddress: string } | null
}

/** The part of an email before the @ (and before any +tag): "ada.l+test@x.com" → "ada.l". */
export function emailLocalPart(email: string | null | undefined): string {
  const local = (email ?? '').split('@')[0] ?? ''
  return (local.split('+')[0] || local).trim()
}

/** Name to show: real name if given, then a stored display name, then a username, then the email's local part. */
export function displayNameFor(u: NameSource | null | undefined): string {
  if (!u) return ''
  const full = [u.firstName, u.lastName].filter((x) => x && x.trim()).join(' ').trim()
  if (full) return full
  const stored = u.publicMetadata?.displayName
  if (typeof stored === 'string' && stored.trim()) return stored.trim()
  if (u.username?.trim()) return u.username.trim()
  return emailLocalPart(u.primaryEmailAddress?.emailAddress) || 'Player'
}
