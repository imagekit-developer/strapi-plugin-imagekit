import settings from './settings.service';
import upload from './upload.service';
import webhook from './webhook.service';

export type PluginServiceType = {
  settings: typeof settings;
  upload: typeof upload;
  webhook: typeof webhook;
};

const pluginService: PluginServiceType = {
  settings,
  upload,
  webhook,
};

export type PluginServices = {
  [key in keyof typeof pluginService]: ReturnType<(typeof pluginService)[key]>;
};

export default pluginService;
