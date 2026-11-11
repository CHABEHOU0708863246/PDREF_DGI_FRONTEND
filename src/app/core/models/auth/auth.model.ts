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

export interface MfaChallenge {
  mfaRequired: true;
  enrollmentRequired: boolean;
  challengeToken: string;
  accessToken?: '';
  expiresAt?: string;
}

export type LoginResult = AuthTokens | MfaChallenge;

export interface MfaEnrollmentMaterial {
  secret: string;
  otpAuthUri: string;
  qrCodeDataUri: string;
}

export interface MfaEnrollmentConfirmed {
  tokens: AuthTokens;
  recoveryCodes: string[];
}

export interface AuthSession extends AuthTokens {
  user: CurrentUser;
}

export function isMfaChallenge(value: LoginResult): value is MfaChallenge {
  return 'challengeToken' in value && !!value.challengeToken;
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
