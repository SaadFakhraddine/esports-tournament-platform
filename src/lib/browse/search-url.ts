/** Shared query key for browse list search (navbar global search + discover pages). */
export const BROWSE_SEARCH_QUERY_KEY = 'search'

export function searchFromUrl(searchParams: URLSearchParams | null | undefined): string {
  return searchParams?.get(BROWSE_SEARCH_QUERY_KEY)?.trim() ?? ''
}

export function browseListHref(
  basePath: string,
  options?: { search?: string; preserveParams?: URLSearchParams | null },
): string {
  const params = new URLSearchParams(options?.preserveParams?.toString() ?? '')
  const trimmed = options?.search?.trim() ?? ''
  if (trimmed) {
    params.set(BROWSE_SEARCH_QUERY_KEY, trimmed)
  } else {
    params.delete(BROWSE_SEARCH_QUERY_KEY)
  }
  const qs = params.toString()
  return `${basePath}${qs ? `?${qs}` : ''}`
}
