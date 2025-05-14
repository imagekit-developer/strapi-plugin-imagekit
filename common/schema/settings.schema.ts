import { z } from 'zod';

export const SettingsSchema = z.object({
  enabled: z.boolean({
    message: 'page.settings.sections.form.base.enabled.errors.required',
  }),
  publicKey: z
    .string({
      message: 'page.settings.sections.form.base.publicKey.errors.required',
    })
    .trim()
    .min(1, {
      message: 'page.settings.sections.form.base.publicKey.errors.required',
    })
    .regex(/^public_.+$/, {
      message: 'page.settings.sections.form.base.publicKey.errors.format',
    }),
  privateKey: z
    .string({
      message: 'page.settings.sections.form.base.privateKey.errors.required',
    })
    .trim()
    .min(1, {
      message: 'page.settings.sections.form.base.privateKey.errors.required',
    })
    .regex(/^private_.+$/, {
      message: 'page.settings.sections.form.base.privateKey.errors.format',
    }),
  urlEndpoint: z
    .string({
      message: 'page.settings.sections.form.base.urlEndpoint.errors.required',
    })
    .trim()
    .min(1, {
      message: 'page.settings.sections.form.base.urlEndpoint.errors.required',
    })
    .url({
      message: 'page.settings.sections.form.base.urlEndpoint.errors.format',
    }),
  isPrivate: z.boolean({
    message: 'page.settings.sections.form.base.isPrivate.errors.required',
  }),
  uploadEnabled: z.boolean({
    message: 'page.settings.sections.form.base.uploadEnabled.errors.required',
  }),
});
