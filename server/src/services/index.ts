import settings from './settings.service';
import upload from './upload.service';

export type PluginServiceType = {
  settings: typeof settings;
  upload: typeof upload;
};

const pluginService: PluginServiceType = {
  settings,
  upload,
};

export type PluginServices = {
  [key in keyof typeof pluginService]: ReturnType<(typeof pluginService)[key]>;
};

export default pluginService;
