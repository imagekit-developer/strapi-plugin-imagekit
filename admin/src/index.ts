import { PLUGIN_ID } from '../../common';
import { Initializer } from './components/Initializer';
import trads from './translations';

export default {
  register(app: any) {
    app.createSettingSection(
      {
        id: PLUGIN_ID,
        intlLabel: {
          id: `${PLUGIN_ID}.plugin.section`,
          defaultMessage: `ImageKit plugin`,
        },
      },
      []
    );
    app.registerPlugin({
      id: PLUGIN_ID,
      initializer: Initializer,
      isReady: false,
      name: PLUGIN_ID,
    });
  },
  bootstrap(app: any) {
    app.addSettingsLink(PLUGIN_ID, {
      intlLabel: {
        id: `${PLUGIN_ID}.plugin.section.item`,
        defaultMessage: 'Configuration',
      },
      id: `${PLUGIN_ID}.configuration`,
      to: `/settings/${PLUGIN_ID}`,
      Component: () =>
        import('./pages/Settings').then((mod) => ({ default: mod.SettingsPageWrapper })),
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
