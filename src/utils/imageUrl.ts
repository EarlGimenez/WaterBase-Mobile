import API_CONFIG from '../config/api';

const backendBaseUrl = API_CONFIG.BASE_URL.replace(/\/api$/, '');

export function resolveProfilePhotoUri(uri: string | null | undefined): string | null {
  const trimmedUri = uri?.trim();
  if (!trimmedUri) return null;

  if (
    trimmedUri.startsWith('http://') || trimmedUri.startsWith('https://') ||
    trimmedUri.startsWith('file://') || trimmedUri.startsWith('content://') ||
    trimmedUri.startsWith('data:')
  ) {
    console.log('resolveProfilePhotoUri: Already absolute URL:', trimmedUri);
    return trimmedUri;
  }

  const normalizedPath = trimmedUri.startsWith('/') ? trimmedUri : `/${trimmedUri}`;
  const resolvedUrl = `${backendBaseUrl}${normalizedPath}`;
  console.log('resolveProfilePhotoUri: Resolved', trimmedUri, 'to', resolvedUrl);
  return resolvedUrl;
}
