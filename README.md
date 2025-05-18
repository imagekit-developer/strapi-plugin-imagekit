[<img width="250" alt="ImageKit.io" src="https://raw.githubusercontent.com/imagekit-developer/imagekit-javascript/master/assets/imagekit-light-logo.svg"/>](https://imagekit.io)

# Strapi Plugin for ImageKit.io

<!-- [![Node CI](https://github.com/imagekit-developer/strapi-plugin-imagekit/workflows/Node%20CI/badge.svg)](https://github.com/imagekit-developer/strapi-plugin-imagekit/) -->

[![npm version](https://img.shields.io/npm/v/strapi-plugin-imagekit)](https://www.npmjs.com/package/strapi-plugin-imagekit)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Twitter Follow](https://img.shields.io/twitter/follow/imagekitio?label=Follow&style=social)](https://twitter.com/ImagekitIo)

A Strapi plugin that provides seamless integration with [ImageKit.io](https://imagekit.io/), enabling you to browse, manage, and deliver optimized media directly from your Strapi admin panel.

ImageKit is a complete media storage, optimization, and transformation solution with an image and video CDN. It integrates with your existing infrastructure (AWS S3, web servers, CDN, custom domains) to deliver optimized images in minutes with minimal code changes.

## Table of Contents

1. [Features](#features)
2. [Requirements](#requirements)
3. [Installation](#installation)
4. [Configuration](#configuration)
   - [Plugin Configuration](#plugin-configuration)
   - [Environment Variables](#environment-variables)
   - [Security Middleware](#security-middleware)
5. [Usage](#usage)
   - [Media Library](#media-library)
   - [Programmatic Usage](#programmatic-usage)
6. [Troubleshooting](#troubleshooting)
7. [Contributing](#contributing)
8. [License](#license)
9. [Support](#support)

## Features

- **Media Library Integration**: Browse and manage your ImageKit media library directly in Strapi
- **Bulk Import**: Import existing ImageKit assets into Strapi with a single click
- **Optimized Delivery**: Serve optimized images and videos through ImageKit
- **Upload**: Upload new files to ImageKit directly from the Strapi media library

## Requirements

Complete requirements are exact same as for of Strapi itself and can be found in [Strapi documentation](https://docs.strapi.io/cms/quick-start).

Minimum environment requirements:

- Node.js >= 18.x <= 20.x
- Yarn >= 4.9.1

## Installation

### From the command line

You can install this plugin from NPM within your Strapi project.

```bash
# Using yarn
yarn add strapi-plugin-imagekit

# Using npm
npm install strapi-plugin-imagekit --save
```

Once isntalled, you must re-build your Strapi instance.

```bash
yarn build
yarn develop
```

Alternatively, you can run Strapi in development mode with `--watch-admin` option:

```bash
yarn develop --watch-admin
```

The **ImageKit** plugin will appear in sidebar and in the Settings section after the app rebuilds.

You can now configure the plugin in the Strapi admin panel.

## Configuration

To use the plugin, you must first [create an ImageKit account](https://imagekit.io/registration/) if you don't have one already.

Then you can configure your Strapi instance using the dedicated Settings page.

### Settings Page Configuration Guide

The ImageKit plugin offers a straightforward settings page within your Strapi admin panel. To get there:

1. Navigate to **Settings** from the main sidebar.
2. Find the **ImageKit Plugin** section and click on **Configuration**.

Here's a breakdown of the available options:

#### Core Plugin Setup

First, **enable the plugin** using the toggle. This activates ImageKit's media processing for your Strapi application.

Next, you'll need to provide your **ImageKit URL Endpoint**. You can locate this in your [ImageKit dashboard](https://imagekit.io/dashboard/url-endpoints); it usually follows the format `https://ik.imagekit.io/your_imagekit_id`. This endpoint is crucial for the plugin to connect to your ImageKit account.

To leverage ImageKit's dynamic image manipulation capabilities, turn on **Use Transform URLs**. This allows you to apply transformations (like resizing, cropping, and optimization) directly via URL parameters.

For enhanced security, especially for private media, enable **Use Signed URLs**. This feature generates time-limited, secure links for your assets. When enabled, you must also set an **Expiry (seconds)** value. This determines how long the signed URL remains valid. Setting it to `0` creates a URL that never expires, but for production environments, a specific expiry duration is recommended.

#### Enabling and Configuring Uploads

To allow your Strapi application to upload files directly to ImageKit, switch on the **Enable Uploads** toggle. You'll then need to input your ImageKit API keys, you can find the keys in your [ImageKit dashboard](https://imagekit.io/dashboard/developer/api-keys):

- **Public Key**: Your ImageKit.io public key (beginning with `public_`) is used for client-side operations.
- **Private Key**: Your ImageKit.io private key (starting with `private_`) is used for server-side operations and must be kept confidential. Never expose your private key in frontend code.

If uploads are disabled, your existing ImageKit media will still be accessible, but no new files will be uploaded from Strapi.

#### Fine-Tuning Upload Behavior

Tailor how your files are handled during the upload process with these settings:

- **Upload Folder**: Define a default `folder` path within your ImageKit media library where uploaded files will be stored (e.g., `/website-assets/blog-images`). This path will be combined with any folder structure you might have in your Strapi media library.

- **Automatic Tagging**: Apply `tags` to your uploaded files by providing a comma-separated list (e.g., `blog, hero-image, featured`). Tags help organize and categorize your media in ImageKit.

- **Tag Management**: Decide how tags are handled for existing files with the **Overwrite Tags** option. If enabled, updating a file will replace its current tags with the new ones. If disabled, new tags will be added to the existing set.

- **Server-Side File Validation**: Implement `checks` to validate files before they are stored. You can define rules based on file size, type, or other attributes. For example, to allow only files up to 5MB, you could use a check like `"file.size" <= "5MB"`. This adds a robust layer of security and control over uploaded content.

- **Content Privacy**: For sensitive files, enable **Mark as Private**. This ensures that files are stored as private in ImageKit and can only be accessed via signed URLs.

#### Saving Your Settings

Once you've configured the plugin to your liking, click the **Save** button located at the top-right of the page. The plugin will validate your inputs. If any issues are found (e.g., an incorrectly formatted API key or URL), error messages will guide you to fix them.

> **Important**: Some configuration changes might require a restart of your Strapi server to take full effect. If you encounter unexpected behavior after updating settings, try restarting your server.

### Advanced: Manual Plugin Configuration (config/plugins.js)

While the recommended way to configure the ImageKit plugin is through the Strapi admin settings page, you can also define or override settings directly in your Strapi project's `config/plugins.js` file. This is useful for programmatic configurations, especially for essential credentials.

Settings defined in `config/plugins.js` will take precedence over those set in the admin UI. If a value is not provided here, the plugin will use the admin UI setting, or its internal default if not configured in either place.

Here's an example showing essential credentials pulled from environment variables, with other common settings hardcoded. You can, of course, choose to source more settings from environment variables if needed by parsing them accordingly (e.g., string 'true' to boolean `true`).

```js
module.exports = ({ env }) => ({
  imagekit: {
    enabled: true,
    config: {
      publicKey: env('IMAGEKIT_PUBLIC_KEY'),
      privateKey: env('IMAGEKIT_PRIVATE_KEY'),
      urlEndpoint: env('IMAGEKIT_URL_ENDPOINT'),

      useSignedUrls: false, // Default: false. Set to true to enable signed URLs for private media.
      expiry: 3600, // Default: 0 (Infinite). URL expiry time in seconds when useSignedUrls is true.

      useTransformUrls: true, // Default: false. Set to true to use ImageKit's transformation URLs.

      uploadEnabled: true, // Default: false. Master switch for enabling/disabling uploads to ImageKit.

      uploadOptions: {
        folder: '/strapi-uploads/', // Default: '/'. Base folder in ImageKit for uploads.
        tags: ['strapi', 'media'], // Default: []. Tags to apply by default.
        overwriteTags: false, // Default: true. True to replace existing tags, false to append.
        checks: '', // Default: '' (no server-side checks). Example: '"file.size" <= "5MB"'.
        isPrivateFile: false, // Default: false. True to mark uploaded files as private by default.
      },
    },
  },
});
```

If you are configuring the plugin via `config/plugins.js` as shown above, ensure these essential environment variables are set in your `.env` file:

```env
IMAGEKIT_PUBLIC_KEY=your_public_key_here
IMAGEKIT_PRIVATE_KEY=your_private_key_here
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_imagekit_id
```

You can, of course, add more environment variables if you choose to configure other optional settings (like `IMAGEKIT_UPLOAD_FOLDER`, `IMAGEKIT_USE_SIGNED_URLS`, etc.) through `env()` calls in your `config/plugins.js`.

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
            'ik.imagekit.io', // Essential: Allows loading images directly from ImageKit's main domain.
            // If you use a custom CNAME with ImageKit (e.g., 'images.yourdomain.com'), add it here too:
            // 'images.yourdomain.com',
          ],
          'media-src': [
            "'self'",
            'data:',
            'blob:',
            'ik.imagekit.io', // Essential: Allows loading video/audio directly from ImageKit's main domain.
            // If you use a custom CNAME with ImageKit, add it here too:
            // 'media.yourdomain.com',
          ],
          'frame-src': [
            "'self'",
            'data:',
            'blob:',
            'eml.imagekit.io', // Allows embedding frames from 'eml.imagekit.io', which might be used for certain ImageKit embeddable UIs or features.
          ],
          upgradeInsecureRequests: null,
        },
      },
    },
  },
];
```

## Contributing

Contributions are welcome! Please read our [contributing guidelines](CONTRIBUTING.md) before submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, please contact [ImageKit Support](https://imagekit.io/contact/) or open an issue in the GitHub repository.
