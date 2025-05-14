import service from './service';
import settings from './settings.service';
import upload from './upload.service';

const pluginService = {
  service,
  settings,
  upload,
};

export type PluginServices = {
  [key in keyof typeof pluginService]: ReturnType<(typeof pluginService)[key]>;
};

export default pluginService;
