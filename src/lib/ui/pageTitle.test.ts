import { describe, expect, it } from 'vitest'
import { pageTitle } from './pageTitle'
import { allTopics } from '../../content/catalog'

describe('pageTitle', () => {
  const t = allTopics[0]!
  it('names the quest on home and section maps', () => {
    expect(pageTitle('/', 'system-design')).toBe('System Design Quest')
    expect(pageTitle('/s/frontend', 'frontend')).toBe('Frontend Quest')
  })
  it('names the page and topic', () => {
    expect(pageTitle(`/topic/${t.slug}`, 'system-design')).toBe(`${t.title} · System Design Quest`)
    expect(pageTitle(`/quiz/${t.slug}`, 'system-design')).toBe(`Quiz: ${t.title} · System Design Quest`)
    expect(pageTitle('/settings', null)).toBe('Settings · System Design Quest')
  })
  it('says when a page is missing', () => {
    expect(pageTitle('/nope', null)).toBe('Page not found · System Design Quest')
    expect(pageTitle('/topic/nope', null)).toBe('Page not found · System Design Quest')
  })
})
