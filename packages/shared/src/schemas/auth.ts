import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

export const loginResponse = z.object({
  token: z.string(),
  user: z.object({
    id: z.string().uuid(),
    username: z.string(),
    role: z.string(),
  }),
});

export const tokenPayloadSchema = z.object({
  sub: z.string().uuid(),
  role: z.string(),
  iat: z.number(),
  exp: z.number(),
});

export type LoginSchema = z.infer<typeof loginSchema>;
export type LoginResponse = z.infer<typeof loginResponse>;
export type TokenPayload = z.infer<typeof tokenPayloadSchema>;
