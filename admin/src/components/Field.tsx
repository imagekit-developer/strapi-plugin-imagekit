import React from 'react';

import { Field as NativeField } from '@strapi/design-system';
import { getTranslated, MessageInput } from '../utils/getTranslation';

type FieldProps = {
  error?: string;
  label: MessageInput;
  hint?: string | React.ReactNode;
  children: React.ReactNode;
};

const getError = (error?: string) => {
  if (!error) {
    return '';
  }

  return getTranslated(error as MessageInput);
};

const Field = ({ error, label, hint, children }: FieldProps) => (
  <NativeField.Root width="100%" hint={hint} error={getError(error)}>
    <NativeField.Label>{getTranslated(label)}</NativeField.Label>
    {children}
    {error && <NativeField.Error />}
    {hint && <NativeField.Hint />}
  </NativeField.Root>
);

export default Field;
