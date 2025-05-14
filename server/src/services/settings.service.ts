import { Core } from '@strapi/strapi';
import { PLUGIN_ID, Settings } from '../../../common';

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
    return await getSettings();
  }

  function getLocalConfig(): Settings {
    const plugin = strapi.plugin(PLUGIN_ID);
    return {
      publicKey: plugin.config<string>('publicKey', ''),
      privateKey: plugin.config<string>('privateKey', ''),
      urlEndpoint: plugin.config<string>('urlEndpoint', ''),
      isPrivate: plugin.config<boolean>('isPrivate', false),
      uploadEnabled: plugin.config<boolean>('uploadEnabled', false),
    };
  }

  async function restoreConfig(): Promise<Settings> {
    await updateSettings(getLocalConfig());
    return await getSettings();
  }

  return { getSettings, updateSettings, restoreConfig };
};

export default settingsService;
