import { Core } from '@strapi/strapi';
import { PLUGIN_ID, Settings } from '../../../common';
import { clearImageKitClient } from './upload.service';

const DEFAULTS: Settings = {
  enabled: false,
  publicKey: '',
  privateKey: '',
  urlEndpoint: '',
  useSignedUrls: false,
  uploadEnabled: false,
  expiry: 0,
  uploadOptions: {
    tags: [],
    folder: '',
    overwriteTags: false,
    overwriteCustomMetadata: false,
    checks: '',
    isPrivateFile: false,
  },
};

function isNonEmptyString(v: unknown): boolean {
  return typeof v === 'string' && v.trim().length > 0;
}

function isConfigUsable(config: Partial<Settings> | undefined): boolean {
  if (!config) return false;
  return (
    isNonEmptyString(config.publicKey) &&
    isNonEmptyString(config.urlEndpoint) &&
    isNonEmptyString(config.privateKey)
  );
}

/** Shallow merge defaults with candidate, returning full Settings */
function fillWithDefaults(candidate: Partial<Settings> | undefined): Settings {
  return {
    ...DEFAULTS,
    ...candidate,
    uploadOptions: {
      ...DEFAULTS.uploadOptions,
      ...(candidate?.uploadOptions ?? {}),
    },
  };
}

const settingsService = ({ strapi }: { strapi: Core.Strapi }) => {
  function getPluginStore() {
    return strapi.store
      ? strapi.store({ type: 'plugin', name: PLUGIN_ID })
      : { get: async () => DEFAULTS, set: async () => {}, delete: async () => {} };
  }

  function getConfigFromFile(): Partial<Settings> {
    const plugin = strapi.plugin(PLUGIN_ID);
    return {
      enabled: plugin.config<boolean>('enabled'),
      publicKey: plugin.config<string>('publicKey'),
      privateKey: plugin.config<string>('privateKey'),
      urlEndpoint: plugin.config<string>('urlEndpoint'),
      useSignedUrls: plugin.config<boolean>('useSignedUrls'),
      uploadEnabled: plugin.config<boolean>('uploadEnabled'),
      expiry: plugin.config<number>('expiry'),
      uploadOptions: {
        tags: plugin.config<string[]>('uploadOptions.tags'),
        folder: plugin.config<string>('uploadOptions.folder'),
        overwriteTags: plugin.config<boolean>('uploadOptions.overwriteTags'),
        overwriteCustomMetadata: plugin.config<boolean>('uploadOptions.overwriteCustomMetadata'),
        checks: plugin.config<string>('uploadOptions.checks'),
        isPrivateFile: plugin.config<boolean>('uploadOptions.isPrivateFile'),
      },
    };
  }

  async function getConfigFromDb(): Promise<Partial<Settings> | undefined> {
    try {
      return (await getPluginStore().get({ key: 'config' })) as Partial<Settings>;
    } catch {
      return undefined;
    }
  }

  async function getSettings(): Promise<Settings> {
    const dbCfg = await getConfigFromDb();
    if (isConfigUsable(dbCfg)) {
      return fillWithDefaults(dbCfg);
    }

    const fileCfg = getConfigFromFile();
    if (isConfigUsable(fileCfg)) {
      return fillWithDefaults(fileCfg);
    }

    return DEFAULTS;
  }

  async function updateSettings(settings: Settings): Promise<Settings> {
    const store = getPluginStore();
    await store.set({ key: 'config', value: settings });
    clearImageKitClient();
    return getSettings();
  }

  async function restoreConfig(): Promise<Settings> {
    const fileCfg = getConfigFromFile();
    const store = getPluginStore();
    await store.set({ key: 'config', value: fillWithDefaults(fileCfg) });
    clearImageKitClient();
    return getSettings();
  }

  return { getSettings, updateSettings, restoreConfig };
};

export default settingsService;
