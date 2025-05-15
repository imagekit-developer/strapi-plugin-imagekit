import { z } from 'zod';
import { UploadOptionsSchema } from './upload-options.schema';

export const SettingsSchema = z
  .object({
    enabled: z.boolean({
      message: 'page.settings.sections.form.base.enabled.errors.required',
    }),
    publicKey: z.union([
      z
        .string({
          message: 'page.settings.sections.form.upload.publicKey.errors.required',
        })
        .trim()
        .min(1, {
          message: 'page.settings.sections.form.upload.publicKey.errors.required',
        })
        .regex(/^public_.+$/, {
          message: 'page.settings.sections.form.upload.publicKey.errors.format',
        }),
      z.string().optional(),
    ]),
    privateKey: z.union([
      z
        .string({
          message: 'page.settings.sections.form.upload.privateKey.errors.required',
        })
        .trim()
        .min(1, {
          message: 'page.settings.sections.form.upload.privateKey.errors.required',
        })
        .regex(/^private_.+$/, {
          message: 'page.settings.sections.form.upload.privateKey.errors.format',
        }),
      z.string().optional(),
    ]),
    urlEndpoint: z.union([
      z
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
      z.string().optional(),
    ]),
    isPrivate: z.boolean({
      message: 'page.settings.sections.form.base.isPrivate.errors.required',
    }),
    expiry: z.union([
      z
        .number({
          message: 'page.settings.sections.form.base.expiry.errors.format',
        })
        .nonnegative({
          message: 'page.settings.sections.form.base.expiry.errors.format',
        }),
      z.number().optional(),
    ]),
    uploadEnabled: z.boolean({
      message: 'page.settings.sections.form.upload.enabled.errors.required',
    }),
    uploadOptions: UploadOptionsSchema.optional(),
    useTransformUrls: z.boolean({
      message: 'page.settings.sections.form.base.useTransformUrls.errors.required',
    }),
  })
  .superRefine((data, ctx) => {
    if (data.enabled && (!data.urlEndpoint || data.urlEndpoint.trim() === '')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'page.settings.sections.form.base.urlEndpoint.errors.required',
        path: ['urlEndpoint'],
      });
    }

    if (data.uploadEnabled) {
      if (!data.publicKey || data.publicKey.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'page.settings.sections.form.upload.publicKey.errors.required',
          path: ['publicKey'],
        });
      } else if (!data.publicKey.match(/^public_.+$/)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'page.settings.sections.form.upload.publicKey.errors.format',
          path: ['publicKey'],
        });
      }

      if (!data.privateKey || data.privateKey.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'page.settings.sections.form.upload.privateKey.errors.required',
          path: ['privateKey'],
        });
      } else if (!data.privateKey.match(/^private_.+$/)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'page.settings.sections.form.upload.privateKey.errors.format',
          path: ['privateKey'],
        });
      }
    }

    if (data.isPrivate && (data.expiry === undefined || data.expiry < 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'page.settings.sections.form.base.expiry.errors.format',
        path: ['expiry'],
      });
    }
  });
