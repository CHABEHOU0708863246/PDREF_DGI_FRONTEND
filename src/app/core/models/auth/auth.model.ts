/** Identite minimale, sans email ni telephone (minimisation des donnees). */
export interface CurrentUser {
  id: string;
  displayName: string;
  roles: string[];
  permissions: string[];
  mustChangePassword?: boolean;
}

/**
 * Session front. Le refresh token n'existe JAMAIS ici : il est porte par un
 * cookie HttpOnly cote backend. Seul l'access token vit en memoire.
 */
export interface AuthSession {
  accessToken: string;
  expiresAt: string;
  user: CurrentUser;
}

export interface LoginCredentials {
  login: string;
  password: string;
}
