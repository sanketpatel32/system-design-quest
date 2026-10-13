import { describe, it, expect } from 'vitest'
import { displayNameFor, emailLocalPart } from './displayName'

const email = (e: string) => ({ primaryEmailAddress: { emailAddress: e } })
describe('display name', () => {
  it('uses the email local part when no name is given', () => {
    expect(displayNameFor(email('ada.lovelace@example.com'))).toBe('ada.lovelace')
    expect(emailLocalPart('sdq-e2e-1+clerk_test@example.com')).toBe('sdq-e2e-1')
  })
  it('prefers a real name, then a stored display name, then a username', () => {
    expect(displayNameFor({ ...email('a@b.c'), firstName: 'Ada', lastName: 'Lovelace' })).toBe('Ada Lovelace')
    expect(displayNameFor({ ...email('a@b.c'), publicMetadata: { displayName: 'ada' } })).toBe('ada')
    expect(displayNameFor({ ...email('a@b.c'), username: 'adal' })).toBe('adal')
  })
  it('falls back safely', () => {
    expect(displayNameFor(null)).toBe('')
    expect(displayNameFor({})).toBe('Player')
  })
})
