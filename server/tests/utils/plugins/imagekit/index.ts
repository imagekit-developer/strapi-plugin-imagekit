import { settingsServiceMock, uploadServiceMock, webhookServiceMock } from './services';

export const imagekitMock = {
  service(name: 'upload' | 'webhook' | 'settings') {
    switch (name) {
      case 'upload':
        return uploadServiceMock;
      case 'webhook':
        return webhookServiceMock;
      case 'settings':
        return settingsServiceMock;
      default: {
        throw new Error(`Unknown service: ${name}`);
      }
    }
  },
  config: jest.fn((_path: string, defaultValue: any) => {
    return defaultValue;
  }),
};
