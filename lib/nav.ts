/**
 * Resolve a site-nav link's href for the page it's rendered on.
 *
 * Section anchors (`#features`, `#pricing`, …) only exist on the homepage, but
 * `<SiteNav>` also renders on `/exam-papers`, `/about`, the legal pages, etc.
 * From any non-home page a bare `#features` would scroll nowhere, so we prefix
 * `/` to route to the homepage section first. On the homepage the href is
 * returned untouched, preserving the existing smooth-scroll behaviour.
 * Non-anchor hrefs (e.g. `/dashboard`) always pass through unchanged.
 */
export function resolveHref(href: string, pathname: string): string {
  if (href.startsWith("#") && pathname !== "/") return `/${href}`;
  return href;
}
