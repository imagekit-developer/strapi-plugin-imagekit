import { camelCase } from 'lodash';
import { useIntl } from 'react-intl';
import { PLUGIN_ID } from '../../../common';
import { TranslationPath } from '../translations';

const getTranslation = (id: string) => `${PLUGIN_ID}.${id}`;

export type MessageInput = TranslationPath | MessageInputObject;

type MessageInputObject = {
  id: TranslationPath;
  props?: {
    [key: string]: any;
  };
};

const getTranslated = (input: MessageInput, defaultMessage = '', inPluginScope = true) => {
  const { formatMessage } = useIntl();

  let formattedId = '';
  if (typeof input === 'string') {
    formattedId = input;
  } else {
    formattedId = input?.id.toString() || formattedId;
  }

  return formatMessage(
    {
      id: `${inPluginScope ? camelCase(PLUGIN_ID) : 'app.components'}.${formattedId}`,
      defaultMessage,
    },
    typeof input === 'string' ? undefined : input?.props
  );
};

export { getTranslated, getTranslation };
