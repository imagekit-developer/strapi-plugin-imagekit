import { Core } from '@strapi/types';

import { PLUGIN_ID } from '../../../common';
import { PluginServices } from '../services';

export const getService = <ServiceName extends keyof PluginServices>(
  strapi: Core.Strapi,
  serviceName: ServiceName
): PluginServices[ServiceName] => {
  return strapi.plugin(PLUGIN_ID).service(serviceName);
};
