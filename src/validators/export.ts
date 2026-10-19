import { z } from 'zod';

export const exportsQuerySchema = z.object({
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 20))
    .pipe(z.number().int())
    .transform((val) => Math.min(Math.max(val, 1), 100)),
  offset: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 0))
    .pipe(z.number().int().min(0)),
  cursor: z.string().trim().min(1).max(2048).optional(),
  developerId: z.string().trim().min(1).max(255).optional(),
  format: z.enum(['csv', 'json']).optional(),
});

export type ExportsQueryInput = z.infer<typeof exportsQuerySchema>;