const en = {
  name: 'ImageKit',
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
        title: 'ImageKit.io Settings',
        description:
          'This integration allows you to easily use ImageKit in Strapi. For more information about configuring the app, see our {link}',
        link: 'documentation',
      },
      sections: {
        form: {
          base: {
            title: 'Base configuration',
            enabled: {
              label: 'Deliver media using ImageKit',
              hint: 'Optimize and deliver media assets through ImageKit',
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
            useSignedUrls: {
              label: 'Use signed urls',
              hint: 'Secure your media with time-limited signed URLs',
            },
            expiry: {
              label: 'URL Expiry Time',
              hint: 'Duration in seconds before signed URLs expire (0 means never expire)',
              errors: {
                format: 'Please provide a valid number of seconds',
              },
            },
            useTransformUrls: {
              label: 'Use ImageKit Transformations for Responsive URLs',
              hint: 'Enable this to use ImageKit transformations when generating responsive image URLs',
              errors: {
                required: 'Field is required',
              },
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
          uploadOptions: {
            title: 'Upload Options',
            description: 'Configure options that will be used when uploading files to ImageKit.',
            tags: {
              label: 'Tags',
              hint: 'Comma separated list of tags to apply to the uploaded file.',
              errors: {
                format: 'Please provide a valid list of tags',
              },
            },
            folder: {
              label: 'Upload Folder',
              hint: 'Base folder path in ImageKit where files will be uploaded. This will be combined with Strapi folders if they exist.',
              errors: {
                format: 'Please provide a valid folder path',
              },
            },
            overwriteTags: {
              label: 'Overwrite Tags',
              hint: 'If set to true, existing tags will be overwritten.',
              errors: {
                format: 'Please provide a valid boolean value',
              },
            },
            overwriteCustomMetadata: {
              label: 'Overwrite Custom Metadata',
              hint: 'If set to true, existing custom metadata will be overwritten.',
              errors: {
                format: 'Please provide a valid boolean value',
              },
            },
            checks: {
              label: 'Checks',
              hint: 'Comma-separated list of the checks you want to run on the file.',
              errors: {
                format: 'Please provide a valid list of checks',
              },
            },
          },
        },
      },
      actions: {
        save: 'Save',
      },
    },
  },
  permissions: {
    'media-library': {
      read: {
        label: 'Media Library',
        description: 'Access the ImageKit Media Library',
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
