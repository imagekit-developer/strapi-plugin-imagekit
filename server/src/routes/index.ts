export default [
  {
    method: 'GET',
    path: '/settings',
    handler: 'settings.getSettings',
    config: {
      policies: [],
    },
  },
  {
    method: 'PUT',
    path: '/settings',
    handler: 'settings.updateSettings',
    config: {
      policies: [],
    },
  },
  {
    method: 'PUT',
    path: '/settings/restore',
    handler: 'settings.restoreConfig',
    config: {
      policies: [],
    },
  },
  {
    method: 'POST',
    path: '/webhook',
    handler: 'webhook.handleWebhook',
    config: {
      policies: [],
      auth: false, // Disable authentication for webhook endpoint
    },
  },
];
