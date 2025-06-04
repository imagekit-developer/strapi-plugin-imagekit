[<img width="250" alt="ImageKit.io" src="https://raw.githubusercontent.com/imagekit-developer/imagekit-javascript/master/assets/imagekit-light-logo.svg"/>](https://imagekit.io)

# Strapi Plugin for ImageKit.io

[![npm version](https://img.shields.io/npm/v/strapi-plugin-imagekit)](https://www.npmjs.com/package/strapi-plugin-imagekit)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Twitter Follow](https://img.shields.io/twitter/follow/imagekitio?label=Follow&style=social)](https://twitter.com/ImagekitIo)

A Strapi plugin that provides seamless integration with [ImageKit.io](https://imagekit.io/), enabling you to browse, manage, and deliver optimized media directly from your Strapi admin panel.

ImageKit is a complete media storage, optimization, and transformation solution with an image and video CDN. It integrates with your existing infrastructure (AWS S3, web servers, CDN, custom domains) to deliver optimized images in minutes with minimal code changes.

## Table of Contents

1. [What You'll Get](#what-youll-get)
2. [Before You Start](#before-you-start)
3. [Installation Steps](#installation-steps)
4. [Setting Up Your Plugin](#setting-up-your-plugin)
   - [Configure in Admin UI](#configure-in-admin-ui)
   - [Set Environment Variables](#set-environment-variables)
   - [Update Security Settings](#update-security-settings)
5. [How to Use](#how-to-use)
   - [Working with Media Library](#working-with-media-library)
   - [Access in Your Code](#access-in-your-code)
6. [Troubleshooting](#troubleshooting)
7. [Contributing](#contributing)
8. [License](#license)
9. [Support](#support)

## Features

- **Manage Media in One Place**: Access and manage all your ImageKit assets directly within Strapi
- **Import with One Click**: Bring existing ImageKit assets into Strapi without re-uploading files
- **Deliver Optimized Assets**: Automatically optimize and transform images and videos using ImageKit's CDN
- **Upload Directly**: Send files straight to ImageKit when uploading to Strapi

## Requirements

Complete requirements are exact same as for of Strapi itself and can be found in [Strapi documentation](https://docs.strapi.io/cms/quick-start).

- Strapi v5
- An [ImageKit account](https://imagekit.io/registration/) (sign up if you don't have one)

## Installation

Open your terminal, navigate to your Strapi project directory, and run one of the following commands:

```bash
# If you use Yarn (recommended)
yarn add strapi-plugin-imagekit

# If you use npm
npm install strapi-plugin-imagekit --save
```

After installation, rebuild your Strapi instance to register the plugin:

```bash
# Complete rebuild
yarn build && yarn develop

# OR development mode with auto-reload for admin panel
yarn develop --watch-admin
```

The **ImageKit** plugin will appear in sidebar and in the Settings section after the app rebuilds.

You can now configure the plugin in the Strapi admin panel.

## Configuration

### Configure in Admin UI

Setup is fast and easy through the Strapi admin panel. Follow these steps:

1. Go to **Settings** in the main sidebar
2. Find and click on **ImageKit** under PLUGINS section

You'll see three configuration sections that you should complete in order:

#### 1. Enter Your API Credentials

First, get your credentials from the [ImageKit dashboard](https://imagekit.io/dashboard/developer/api-keys):

1. Copy your **Public Key** (starts with `public_`) from ImageKit and paste it in the first field
2. Copy your **Private Key** (starts with `private_`) from ImageKit and paste it in the second field
3. Enter your **URL Endpoint** from your [ImageKit URL endpoints page](https://imagekit.io/dashboard/url-endpoints) - it looks like `https://ik.imagekit.io/your_imagekit_id`

#### 2. Configure Media Delivery

After adding your credentials, set up how your media will be served:

1. Toggle **Enable Plugin** to ON to activate the integration
2. Enable **Use Transform URLs** if you want to wish to use ImageKit's transformation capabilities for responsive images
3. If you need secure access to media:
   - Enable **Use Signed URLs** (requires valid API keys)
   - Set an **Expiry** time in seconds (use `0` for never expire, or a specific duration like `3600` for 1 hour)

#### 3. Set Up Upload Options

Decide how uploads should work:

1. Toggle **Enable Uploads** to ON if you want to upload files to ImageKit (requires valid API keys)
2. Configure additional upload settings:
   - **Upload Folder**: Set a base path in ImageKit for your uploads (e.g., `/strapi-media`)
   - **Tags**: Add comma-separated tags to organize your files (e.g., `strapi,content,blog`)
   - **Overwrite Tags**: Toggle ON to replace existing tags or OFF to add to them
   - **File Checks**: Add validation rules like `"file.size" <= "5MB"` to enforce upload restrictions
   - **Mark as Private**: Toggle ON to make uploaded files private (requires signed URLs to access)

#### 4. Save Your Configuration

Click the **Save** button in the top-right corner to apply your settings.

> **Note**: Some changes may require restarting your Strapi server to take full effect.

### Advanced: Manual Plugin Configuration (config/plugins.js)

If you prefer configuring via code instead of the admin UI, follow these steps:

1. Create or update your `config/plugins.js` file with ImageKit configuration:

```js
module.exports = ({ env }) => ({
  imagekit: {
    enabled: true,
    config: {
      // Basic Configuration
      publicKey: env('IMAGEKIT_PUBLIC_KEY'),
      privateKey: env('IMAGEKIT_PRIVATE_KEY'),
      urlEndpoint: env('IMAGEKIT_URL_ENDPOINT'),

      // Delivery Configuration
      enabled: true,
      useTransformUrls: true,
      useSignedUrls: false,
      expiry: 3600, // URL expiry time in seconds when useSignedUrls is true

      // Upload Configuration
      uploadEnabled: true,

      // Upload Options
      uploadOptions: {
        folder: '/strapi-uploads/',
        tags: ['strapi', 'media'],
        overwriteTags: false,
        checks: '', // Example: '"file.size" <= "5MB"'
        isPrivateFile: false,
      },
    },
  },
});
```

2. Add these variables to your `.env` file:

```env
IMAGEKIT_PUBLIC_KEY=your_public_key_here
IMAGEKIT_PRIVATE_KEY=your_private_key_here
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_imagekit_id
```

You can, of course, add more environment variables if you choose to configure other optional settings (like `IMAGEKIT_UPLOAD_FOLDER`, `IMAGEKIT_USE_SIGNED_URLS`, etc.) through `env()` calls in your `config/plugins.js`.

3. Restart your Strapi server for changes to take effect:

```bash
yarn develop
```

### Configure Security Middleware (CSP)

To ensure your Strapi application can securely load assets and interact with ImageKit services, you need to update your Content Security Policy (CSP) settings. This is configured in the `strapi::security` middleware.

Modify your `config/middlewares.js` file as follows. This configuration allows your Strapi admin panel and frontend (if applicable) to load images, videos, and potentially embeddable ImageKit frames, while maintaining a secure policy:

```js
// config/middlewares.js
module.exports = [
  {
    name: 'strapi::security',
    config: {
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'connect-src': ["'self'", 'https:'],
          'img-src': [
            "'self'",
            'data:',
            'blob:',
            'ik.imagekit.io', // Add ImageKit domain for images
            // Add your custom domain if you use one with ImageKit:
            // 'images.yourdomain.com',
          ],
          'media-src': [
            "'self'",
            'data:',
            'blob:',
            'ik.imagekit.io', // Add ImageKit domain for videos/audio
            // Add your custom domain if you use one:
            // 'media.yourdomain.com',
          ],
          'frame-src': [
            "'self'",
            'data:',
            'blob:',
            'eml.imagekit.io', // For ImageKit UI components
          ],
          upgradeInsecureRequests: null,
        },
      },
    },
  },
  // Keep your other middleware entries here
];
```

> **Important**: If you use a custom domain with ImageKit, uncomment and update the relevant lines with your domain.

## Contributing

Contributions are welcome! Please read our [contributing guidelines](CONTRIBUTING.md) before submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, please contact [ImageKit Support](https://imagekit.io/contact/) or open an issue in the GitHub repository.
