import { z } from 'zod';

export const USER_ROLES = ['admin', 'employee'] as const;

export const createUserSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(50)
    .regex(
      /^[a-zA-Z0-9_\-./,]+$/,
      'Username can only contain letters, numbers, underscores, hyphens, dots, and commas',
    ),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(USER_ROLES).default('employee'),
});

export const updateUserSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(50)
    .regex(/^[a-zA-Z0-9_\-./,]+$/)
    .optional(),
  email: z.string().email().optional(),
  password: z.string().min(8).optional(),
  role: z.enum(USER_ROLES).optional(),
  isActive: z.boolean().optional(),
});

export const userResponse = z.object({
  id: z.string().uuid(),
  username: z.string(),
  email: z.string(),
  role: z.string(),
  isActive: z.boolean(),
  createdAt: z.date(),
});

export type CreateUserSchema = z.infer<typeof createUserSchema>;
export type UpdateUserSchema = z.infer<typeof updateUserSchema>;
export type UserResponse = z.infer<typeof userResponse>;
