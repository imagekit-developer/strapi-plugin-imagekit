import { SettingsSchema } from '../schema';

export const getSettingsValidator = (payload: unknown) => {
  const result = SettingsSchema.safeParse(payload);

  if (!result.success) {
    const reason = result.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message }));
    return Promise.reject(reason);
  }

  return Promise.resolve(result.data);
};
