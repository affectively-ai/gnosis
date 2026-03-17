import {
  DOCS_HOME_SLUG,
  DOCS_LIBRARY_SLUG,
  DOCS_PRODUCTS_SLUG,
  DOCS_QUICKSTART_SLUG,
  buildDocsPageUrl,
  getDocsTrack,
  type DocsTrackId,
} from '@affectively/shared-utils/docsManifest';

export const FOUNDATION_DOCS_HOME_URL = buildDocsPageUrl(DOCS_HOME_SLUG);
export const FOUNDATION_DOCS_QUICKSTART_URL =
  buildDocsPageUrl(DOCS_QUICKSTART_SLUG);
export const FOUNDATION_DOCS_PRODUCTS_URL =
  buildDocsPageUrl(DOCS_PRODUCTS_SLUG);
export const FOUNDATION_DOCS_LIBRARY_URL = buildDocsPageUrl(DOCS_LIBRARY_SLUG);

export function getFoundationDocsTrackUrl(trackId: DocsTrackId): string {
  const track = getDocsTrack(trackId);
  return buildDocsPageUrl(track?.docsSlug ?? DOCS_HOME_SLUG);
}

export function getFoundationApiTrackUrl(trackId: DocsTrackId): string | null {
  const track = getDocsTrack(trackId);
  return track?.apiSlug ? buildDocsPageUrl(track.apiSlug) : null;
}

export function getFoundationTrackBookUrl(trackId: DocsTrackId): string | null {
  const track = getDocsTrack(trackId);
  const ebookSlug = track?.ebookSlugs[0];
  return ebookSlug ? buildDocsPageUrl(ebookSlug) : null;
}
