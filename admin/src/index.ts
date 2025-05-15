import { PLUGIN_ID } from '../../common';
import ImageKitLogo from './components/ImageKitLogo';
import { Initializer } from './components/Initializer';
import trads from './translations';

export default {
  register(app: any) {
    app.addMenuLink({
      to: `plugins/${PLUGIN_ID}`,
      icon: ImageKitLogo,
      intlLabel: {
        id: `${PLUGIN_ID}.name`,
        defaultMessage: PLUGIN_ID,
      },
      position: 3,
      permissions: [
        { action: 'plugin::upload.read', subject: null },
        { action: 'plugin::upload.assets.create', subject: null },
        { action: 'plugin::upload.assets.update', subject: null },
      ],
      Component: async () => {
        const { MediaLibraryPageWrapper } = await import('./pages/MediaLibrary');

        return MediaLibraryPageWrapper;
      },
    });

    app.createSettingSection(
      {
        id: PLUGIN_ID,
        intlLabel: {
          id: `${PLUGIN_ID}.plugin.section`,
          defaultMessage: `ImageKit plugin`,
        },
      },
      [
        {
          id: `${PLUGIN_ID}.plugin.section.item`,
          intlLabel: {
            id: `${PLUGIN_ID}.plugin.section.item`,
            defaultMessage: 'Configuration',
          },
          to: `/settings/${PLUGIN_ID}`,
          Component: () =>
            import('./pages/Settings').then((mod) => ({ default: mod.SettingsPageWrapper })),
        },
      ]
    );
    app.registerPlugin({
      id: PLUGIN_ID,
      initializer: Initializer,
      isReady: false,
      name: PLUGIN_ID,
    });
  },

  async registerTrads({ locales }: { locales: string[] }) {
    return Promise.all(
      locales.map(async (locale) => {
        if (locale in trads) {
          const typedLocale = locale as keyof typeof trads;
          return trads[typedLocale]().then(({ default: trad }) => {
            return { data: trad, locale };
          });
        }
        return {
          data: {},
          locale,
        };
      })
    );
  },
};
