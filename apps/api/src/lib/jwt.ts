import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production-use-a-long-random-string';
const JWT_TTL = process.env.JWT_TTL || '8h';

export interface JwtPayload {
  sub: string;
  role: string;
}

export interface SignedTokenPayload extends JwtPayload {
  iat: number;
  exp: number;
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_TTL } as jwt.SignOptions);
}

export function verifyToken(token: string): SignedTokenPayload {
  const decoded = jwt.verify(token, JWT_SECRET) as SignedTokenPayload;
  return decoded;
}

export function decodeToken(token: string): SignedTokenPayload | null {
  const decoded = jwt.decode(token) as SignedTokenPayload | null;
  return decoded;
}
