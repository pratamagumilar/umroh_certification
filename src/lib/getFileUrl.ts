/**
 * Resolves a file path to a usable URL for the frontend.
 * 
 * @param path The path stored in the database (e.g. '/materials/2026/07/xxx.pdf' or 'https://...')
 * @returns The resolved URL to be used in src or href attributes
 */
export function getFileUrl(path: string | undefined | null): string {
  if (!path) return '';

  // Jika URL sudah berupa http/https (misalnya dari Supabase Storage)
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  // Jika path adalah sertifikat, yang sudah ada di public/certificates
  if (path.startsWith('/certificates')) {
    return path;
  }

  // Jika path belum diawali slash, tambahkan
  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  // Hindari double /api/files
  if (cleanPath.startsWith('/api/files')) {
    return cleanPath;
  }

  // Fallback untuk local storage /materials/...
  return `/api/files${cleanPath}`;
}
