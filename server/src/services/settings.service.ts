import { Core } from '@strapi/strapi';
import { PLUGIN_ID, Settings } from '../../../common';
import { clearImageKitClient } from './upload.service';

const settingsService = ({ strapi }: { strapi: Core.Strapi }) => {
  function getPluginStore() {
    if (strapi.store) {
      return strapi.store({ type: 'plugin', name: PLUGIN_ID });
    }
    return {
      get: async () => {},
      set: async () => {},
      delete: async () => {},
    };
  }

  async function getSettings(): Promise<Settings> {
    const pluginStore = getPluginStore();
    const config = (await pluginStore.get({ key: 'config' })) as Settings;
    return config;
  }

  async function updateSettings(settings: Settings): Promise<Settings> {
    const pluginStore = getPluginStore();
    await pluginStore.set({ key: 'config', value: settings });
    clearImageKitClient();
    return await getSettings();
  }

  function getLocalConfig(): Settings {
    const plugin = strapi.plugin(PLUGIN_ID);
    return {
      enabled: plugin.config<boolean>('enabled', false),
      publicKey: plugin.config<string>('publicKey', ''),
      privateKey: plugin.config<string>('privateKey', ''),
      urlEndpoint: plugin.config<string>('urlEndpoint', ''),
      useSignedUrls: plugin.config<boolean>('useSignedUrls', false),
      uploadEnabled: plugin.config<boolean>('uploadEnabled', false),
      expiry: plugin.config<number>('expiry', 0),
      uploadOptions: {
        tags: plugin.config<string[]>('uploadOptions.tags', []),
        folder: plugin.config<string>('uploadOptions.folder', ''),
        overwriteTags: plugin.config<boolean>('uploadOptions.overwriteTags', false),
        overwriteCustomMetadata: plugin.config<boolean>(
          'uploadOptions.overwriteCustomMetadata',
          false
        ),
        checks: plugin.config<string>('uploadOptions.checks', ''),
        isPrivateFile: plugin.config<boolean>('uploadOptions.isPrivateFile', false),
      },
    };
  }

  async function restoreConfig(): Promise<Settings> {
    await updateSettings(getLocalConfig());
    return await getSettings();
  }

  return { getSettings, updateSettings, restoreConfig };
};

export default settingsService;
