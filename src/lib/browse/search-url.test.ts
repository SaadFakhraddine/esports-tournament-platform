import { describe, expect, test } from 'vitest'
import { browseListHref, searchFromUrl, BROWSE_SEARCH_QUERY_KEY } from './search-url'

describe('searchFromUrl', () => {
  test('reads search param', () => {
    expect(searchFromUrl(new URLSearchParams('search=valorant'))).toBe('valorant')
  })

  test('returns empty when missing', () => {
    expect(searchFromUrl(new URLSearchParams())).toBe('')
  })
})

describe('browseListHref', () => {
  test('adds encoded search', () => {
    expect(browseListHref('/dashboard/discover/tournaments', { search: 'a b' })).toBe(
      '/dashboard/discover/tournaments?search=a+b',
    )
  })

  test('preserves other params', () => {
    const existing = new URLSearchParams('filter=live')
    expect(browseListHref('/tournaments', { search: 'cup', preserveParams: existing })).toBe(
      '/tournaments?filter=live&search=cup',
    )
  })

  test('removes search when empty', () => {
    const existing = new URLSearchParams(`${BROWSE_SEARCH_QUERY_KEY}=old&filter=open`)
    expect(browseListHref('/tournaments', { search: '', preserveParams: existing })).toBe(
      '/tournaments?filter=open',
    )
  })
})
