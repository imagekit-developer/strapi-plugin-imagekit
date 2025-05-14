import { z } from 'zod';
import { SettingsSchema } from '../schema';

export type Settings = z.infer<typeof SettingsSchema>;
