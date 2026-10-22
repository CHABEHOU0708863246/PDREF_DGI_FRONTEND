/** Identite minimale, sans PII inutile. */
export interface CurrentUser {
  id: string;
  login: string;
  displayName: string;
  email?: string | null;
  directionId?: string | null;
  directionCode?: string | null;
  roles: string[];
  permissions: string[];
  mustChangePassword: boolean;
}

/** Le refresh token n'existe JAMAIS ici : il est porte par un cookie HttpOnly. */
export interface AuthTokens {
  accessToken: string;
  expiresAt: string;
}

export interface AuthSession extends AuthTokens {
  user: CurrentUser;
}

export interface LoginCredentials {
  login: string;
  password: string;
}

export interface ForgotPasswordRequest {
  login: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}
