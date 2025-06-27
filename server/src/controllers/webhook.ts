import { Core } from '@strapi/strapi';

const webhookController = ({ strapi }: { strapi: Core.Strapi }) => ({
  /**
   * Handle ImageKit webhook
   * @param {Object} ctx - The request context
   */
  async handleWebhook(ctx: any) {
    try {
      const { body } = ctx.request;

      // Validate the webhook payload
      if (!body || !body.eventType || !body.data || !Array.isArray(body.data)) {
        return ctx.badRequest({
          status: 'error',
          message: 'Invalid webhook payload',
          details: 'The webhook payload must contain eventType and an array of data items',
        });
      }

      if (body.data.length === 0) {
        return ctx.badRequest({
          status: 'error',
          message: 'No files to import',
          details: 'The webhook payload contains an empty data array',
        });
      }

      // Process the webhook data
      const result = await strapi.plugin('imagekit').service('webhook').processWebhook(body);

      // Check if we got any successful imports
      if (result && result.length > 0) {
        // Add statistics for successful imports vs attempted imports
        return ctx.send({
          status: 'success',
          message: `Imported ${result.length} file(s) successfully`,
          imported: result,
          stats: {
            total: body.data.length,
            successful: result.length,
            failed: body.data.length - result.length,
          },
        });
      } else {
        // We got a result but no files were imported
        return ctx.send({
          status: 'warning',
          message: 'No files were imported',
          imported: [],
          stats: {
            total: body.data.length,
            successful: 0,
            failed: body.data.length,
          },
          details: 'Files may have been skipped or failed to import',
        });
      }
    } catch (error: any) {
      strapi.log.error('[ImageKit Webhook Controller] Error handling webhook:', error);

      // Return a structured error response
      return ctx.badRequest({
        status: 'error',
        message: 'Failed to process webhook',
        error: error.message,
        details: error.details || 'An unexpected error occurred during file import',
        stack: strapi.config.get('environment') === 'development' ? error.stack : undefined,
      });
    }
  },
});

export default webhookController;
