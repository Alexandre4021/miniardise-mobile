export type ApiErrorCode =
  | 'network'
  | 'timeout'
  | 'blocked' // pare-feu / anti-robots de l'hébergeur
  | 'not_found'
  | 'unauthorized'
  | 'forbidden'
  | 'rate_limited'
  | 'server'
  | 'invalid_response'
  | 'unknown';

export class ApiError extends Error {
  constructor(
    public readonly code: ApiErrorCode,
    message: string,
    public readonly status = 0,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** Message compréhensible par un client, sans détail technique. */
export function userMessage(error: unknown): string {
  if (!(error instanceof ApiError)) return 'Une erreur inattendue est survenue.';
  switch (error.code) {
    case 'network':
    case 'timeout':
      return 'Connexion impossible. Vérifiez votre réseau puis réessayez.';
    case 'blocked':
      return 'La boutique est momentanément inaccessible. Réessayez dans quelques minutes.';
    case 'not_found':
      return 'Cet élément est introuvable.';
    case 'unauthorized':
      return 'Votre session a expiré. Merci de vous reconnecter.';
    case 'forbidden':
      return 'Accès refusé par la boutique.';
    case 'rate_limited':
      return 'Trop de tentatives. Patientez un instant.';
    default:
      return 'Le service est momentanément indisponible. Réessayez plus tard.';
  }
}

export function errorFromStatus(status: number): ApiError {
  if (status === 401) return new ApiError('unauthorized', 'HTTP 401', status);
  if (status === 403) return new ApiError('forbidden', 'HTTP 403', status);
  if (status === 404) return new ApiError('not_found', 'HTTP 404', status);
  if (status === 406) return new ApiError('blocked', 'HTTP 406', status);
  if (status === 429) return new ApiError('rate_limited', 'HTTP 429', status);
  if (status >= 500) return new ApiError('server', `HTTP ${status}`, status);
  return new ApiError('unknown', `HTTP ${status}`, status);
}
