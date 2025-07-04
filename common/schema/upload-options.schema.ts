import { z } from 'zod';

export const UploadOptionsSchema = z.object({
  tags: z.array(z.string()).optional(),
  folder: z.string().optional(),
  overwriteTags: z.boolean().optional(),
  overwriteCustomMetadata: z.boolean().optional(),
  checks: z.string().optional(),
  isPrivateFile: z.boolean().optional().default(false),
});

export type UploadOptionsForm = z.infer<typeof UploadOptionsSchema>;
