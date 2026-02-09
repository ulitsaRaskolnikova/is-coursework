import { getAccessToken } from './authTokens';

interface JwtPayload {
  sub?: string;
  email?: string;
  isAdmin?: boolean;
  type?: string;
  iat?: number;
  exp?: number;
}

export const parseJwt = (token: string): JwtPayload | null => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    return payload as JwtPayload;
  } catch {
    return null;
  }
};

export const isCurrentUserAdmin = (): boolean => {
  const token = getAccessToken();
  if (!token) return false;
  const payload = parseJwt(token);
  return payload?.isAdmin === true;
};
