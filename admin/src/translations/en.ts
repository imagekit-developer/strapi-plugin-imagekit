const en = {
  page: {
    settings: {
      state: {
        loading: 'Loading...',
      },
      notification: {
        save: {
          success: 'Settings saved',
          error: 'Failed to save settings: {details}',
        },
        admin: {
          restore: {
            success: 'Settings restored',
            error: 'Failed to restore settings: {details}',
          },
          sync: {
            success: 'Media Library synchronized',
            error: 'Failed to synchronize your Media Library: {details}',
          },
          desync: {
            success: 'Media Library desynchronized',
            error: 'Failed to desynchronize your Media Library: {details}',
          },
        },
      },
      header: {
        title: 'Imagekit.io Settings',
        description:
          'This integration allows you to easily use Imagekit.io in Strapi. For more information about configuring the app, see our {link}',
        link: 'documentation',
      },
      sections: {
        form: {
          base: {
            title: 'Base configuration',
            enabled: {
              label: 'Deliver media using ImageKit',
              hint: 'Enable delivery of media using ImageKit',
            },
            urlEndpoint: {
              label: 'ImageKit URL Endpoint',
              hint: 'The base URL endpoint from your {link}.',
              example: 'Example: {example}',
              errors: {
                format: 'Please provide a URL or path in valid format',
                trailingSlash: 'URL should end with a trailing slash',
              },
            },
            isPrivate: {
              label: 'Use signed urls',
              hint: 'Deliver images using signed urls',
            },
          },
          upload: {
            title: 'Upload configuration',
            enabled: {
              label: 'Enable ImageKit upload',
              hint: 'Enable ImageKit upload for Strapi Media Library',
            },
            publicKey: {
              label: 'ImageKit Public Key',
              hint: 'The public API key for your ImageKit account.',
              example: 'Example: {example}',
              errors: {
                format: 'Please provide a valid Public Key and must start with "public_"',
                required: 'Field is required',
              },
            },
            privateKey: {
              label: 'ImageKit Private Key',
              hint: 'The private API key for your ImageKit account.',
              example: 'Example: {example}',
              errors: {
                format: 'Please provide a valid Private Key and must start with "private_"',
                required: 'Field is required',
              },
            },
          },
        },
      },
    },
  },
  components: {
    confirmation: {
      dialog: {
        header: 'Confirmation',
        description: 'Are you sure you want to perform this action?',
        button: {
          cancel: 'Cancel',
          confirm: 'Confirm',
        },
      },
    },
  },
};

export default en;

export type EN = typeof en;
