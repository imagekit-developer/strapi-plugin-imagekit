export const settingsServiceMock = {
  getSettings: jest.fn(),
  updateSettings: jest.fn(),
  restoreConfig: jest.fn(),
};

export const uploadServiceMock = {
  upload: jest.fn(),
  uploadStream: jest.fn(),
  delete: jest.fn(),
  isPrivate: jest.fn(),
  getSignedUrl: jest.fn(),
  getClient: jest.fn(),
};

export const webhookServiceMock = {
  processWebhook: jest.fn(),
  importFileToStrapi: jest.fn(),
};
