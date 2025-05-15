import {
  Box,
  Button,
  Flex,
  Grid,
  Link,
  Field as NativeField,
  NumberInput,
  Toggle,
  Typography,
} from '@strapi/design-system';
import { Check } from '@strapi/icons';
import { Layouts, Page, useNotification, useRBAC } from '@strapi/strapi/admin';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Formik, FormikHelpers } from 'formik';
import { camelCase, isEmpty, isNil, merge } from 'lodash';
import { useCallback, useState } from 'react';
import { useIntl } from 'react-intl';
import {
  flattenPermissions,
  PLUGIN_ID,
  Settings,
  SettingsForm,
  SettingsSchema,
  tryCatch,
} from '../../../../common';
import { Code } from '../../components/Code';
import Field from '../../components/Field';
import { HeaderLink } from '../../components/HeaderLink';
import { HttpError, HttpErrorDetails } from '../../errors/HttpError';
import { useHTTP } from '../../hooks';
import { getTranslated } from '../../utils/getTranslation';

const SettingsPage = () => {
  const { formatMessage } = useIntl();
  const { toggleNotification } = useNotification();
  const queryClient = useQueryClient();
  const http = useHTTP();

  const [submitInProgress, setSubmitInProgress] = useState(false);

  const {
    isLoading: isLoadingForPermissions,
    allowedActions: { canChange },
  } = useRBAC(flattenPermissions);

  const { data, isLoading } = useQuery({
    queryKey: [camelCase(PLUGIN_ID), 'get-settings'],
    queryFn: () => http.get<Settings>('/settings'),
    select: (response) => ({
      enabled: response.enabled,
      urlEndpoint: response.urlEndpoint,
      publicKey: response.publicKey,
      privateKey: response.privateKey,
      isPrivate: response.isPrivate,
      uploadEnabled: response.uploadEnabled,
      uploadOptions: response.uploadOptions,
      expiry: response.expiry,
      useTransformUrls: response.useTransformUrls,
    }),
  });

  const saveSettings = useMutation({
    mutationKey: [camelCase(PLUGIN_ID), 'save-settings'],
    mutationFn: (payload: SettingsForm) => http.put<Settings>('/settings', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [camelCase(PLUGIN_ID), 'get-settings'],
      });
      toggleNotification({
        type: 'success',
        message: formatMessage({
          id: `${camelCase(PLUGIN_ID)}.page.settings.notification.save.success`,
        }),
      });
    },
    onError: (error: HttpError<HttpErrorDetails[]>) => {
      if (error instanceof HttpError) {
        const details = error.response?.map((e: { message: string }) => e.message).join('\n');
        toggleNotification({
          type: 'warning',
          message: formatMessage(
            {
              id: `${camelCase(PLUGIN_ID)}.page.settings.notification.save.error`,
            },
            { details }
          ),
        });
      }
    },
  });

  const preparePayload = useCallback(
    (values: SettingsForm) => {
      const payload: SettingsForm = {
        enabled: values.enabled,
        publicKey: values.publicKey,
        privateKey: values.privateKey,
        urlEndpoint: values.urlEndpoint,
        isPrivate: values.isPrivate,
        expiry: values.expiry,
        uploadEnabled: values.uploadEnabled,
        uploadOptions: values.uploadOptions,
        useTransformUrls: values.useTransformUrls,
      };

      if (values.privateKey.trim() !== data?.privateKey) {
        payload.privateKey = values.privateKey;
      }

      return payload;
    },
    [data]
  );

  const onSubmitForm = async (values: SettingsForm, actions: FormikHelpers<SettingsForm>) => {
    setSubmitInProgress(true);
    const payload = preparePayload(values);

    await tryCatch(
      saveSettings.mutateAsync(payload).then(() => actions.resetForm({ values })),
      () => {
        setSubmitInProgress(false);
      }
    );
  };

  const boxDefaultProps = {
    width: '100%',
    background: 'neutral0',
    hasRadius: true,
    shadow: 'filterShadow',
    padding: 6,
  };

  const initialValues: SettingsForm = {
    enabled: false,
    publicKey: '',
    privateKey: '',
    urlEndpoint: '',
    isPrivate: false,
    expiry: 0,
    uploadEnabled: false,
    uploadOptions: {
      tags: [],
      folder: '',
      overwriteTags: false,
      overwriteCustomMetadata: false,
      checks: '',
    },
    useTransformUrls: false,
  };

  const validate = async (values: SettingsForm) => {
    const payload = preparePayload(values);
    const result = SettingsSchema.safeParse({
      ...payload,
      privateKey: isNil(payload.privateKey) ? data?.privateKey : payload.privateKey,
    });

    if (result.success) {
      // Maybe Validate private key
      return;
    }

    const errors = result.error.issues.reduce(
      (acc, issue) => {
        acc[camelCase(issue.path.join('.'))] = issue.message;
        return acc;
      },
      {} as Record<string, string>
    );

    if (isEmpty(errors)) {
      // Maybe Validate private key
      return;
    }

    return errors;
  };

  if (isLoading || isLoadingForPermissions) {
    return <Page.Loading>{getTranslated('page.settings.state.loading')}</Page.Loading>;
  }

  const asyncActionInProgress = submitInProgress;

  return (
    <Page.Main>
      <Page.Title>{getTranslated('page.settings.header.title', 'Settings')}</Page.Title>
      <Formik<SettingsForm>
        onSubmit={onSubmitForm}
        initialValues={merge({ ...initialValues }, data || {}) as SettingsForm}
        validate={validate}
        validateOnChange={false}
        validateOnBlur={false}
        enableReinitialize={true}
      >
        {({ handleSubmit, values, errors, dirty, handleChange, setValues }) => (
          <form noValidate onSubmit={handleSubmit}>
            <Layouts.Header
              title={getTranslated('page.settings.header.title')}
              subtitle={
                <Typography variant="epsilon" textColor="neutral600">
                  {formatMessage(
                    {
                      id: `${camelCase(PLUGIN_ID)}.page.settings.header.description`,
                    },
                    {
                      link: (
                        <HeaderLink>
                          <Link
                            href="https://imagekit.io/docs/integration/strapi"
                            target="_blank"
                            isExternal
                          >
                            {getTranslated('page.settings.header.link')}
                          </Link>
                        </HeaderLink>
                      ),
                    }
                  )}
                </Typography>
              }
              primaryAction={
                canChange && (
                  <Button
                    type="submit"
                    startIcon={<Check />}
                    disabled={asyncActionInProgress}
                    loading={asyncActionInProgress}
                  >
                    {getTranslated('page.settings.actions.save')}
                  </Button>
                )
              }
            />
            <Layouts.Content>
              <Flex width="100%" direction="column" gap={6}>
                <Box {...boxDefaultProps}>
                  <Flex width="100%" direction="column" alignItems="flex-start" gap={4}>
                    <Typography variant="delta" tag="h2">
                      {getTranslated('page.settings.sections.form.base.title')}
                    </Typography>
                    <Grid.Root width="100%" gap={4}>
                      <Grid.Item col={4} xs={12} alignItems="flex-start">
                        <Field
                          error={errors?.enabled}
                          label={'page.settings.sections.form.base.enabled.label'}
                          hint={formatMessage({
                            id: `${camelCase(PLUGIN_ID)}.page.settings.sections.form.base.enabled.hint`,
                          })}
                        >
                          <Toggle
                            checked={values.enabled}
                            offLabel={formatMessage({
                              id: 'app.components.ToggleCheckbox.off-label',
                              defaultMessage: 'Off',
                            })}
                            onLabel={formatMessage({
                              id: 'app.components.ToggleCheckbox.on-label',
                              defaultMessage: 'On',
                            })}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                              handleChange({
                                target: { name: 'enabled', value: e.target.checked },
                              });
                            }}
                          />
                        </Field>
                      </Grid.Item>
                      {values.enabled && (
                        <>
                          <Grid.Item col={4} xs={12} alignItems="flex-start">
                            <Field
                              error={errors.urlEndpoint}
                              label={'page.settings.sections.form.base.urlEndpoint.label'}
                              hint={
                                <>
                                  {formatMessage(
                                    {
                                      id: `${camelCase(PLUGIN_ID)}.page.settings.sections.form.base.urlEndpoint.hint`,
                                    },
                                    {
                                      link: (
                                        <Link
                                          href="https://imagekit.io/dashboard/url-endpoints"
                                          target="_blank"
                                        >
                                          ImageKit dashboard
                                        </Link>
                                      ),
                                    }
                                  )}
                                  <br />
                                  <br />
                                  {formatMessage(
                                    {
                                      id: `${camelCase(PLUGIN_ID)}.page.settings.sections.form.base.urlEndpoint.example`,
                                    },
                                    {
                                      example: <Code>https://ik.imagekit.io/your_imagekit_id</Code>,
                                    }
                                  )}
                                </>
                              }
                            >
                              <NativeField.Input
                                type="url"
                                name="urlEndpoint"
                                value={values.urlEndpoint}
                                onChange={handleChange}
                                required
                              />
                            </Field>
                          </Grid.Item>
                          <Grid.Item col={4} xs={12} alignItems="flex-start">
                            <Field
                              error={errors?.useTransformUrls}
                              label={'page.settings.sections.form.base.useTransformUrls.label'}
                              hint={formatMessage({
                                id: `${camelCase(PLUGIN_ID)}.page.settings.sections.form.base.useTransformUrls.hint`,
                              })}
                            >
                              <Toggle
                                checked={values.useTransformUrls}
                                offLabel={formatMessage({
                                  id: 'app.components.ToggleCheckbox.off-label',
                                  defaultMessage: 'Off',
                                })}
                                onLabel={formatMessage({
                                  id: 'app.components.ToggleCheckbox.on-label',
                                  defaultMessage: 'On',
                                })}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                  handleChange({
                                    target: { name: 'useTransformUrls', value: e.target.checked },
                                  });
                                }}
                              />
                            </Field>
                          </Grid.Item>
                        </>
                      )}
                    </Grid.Root>
                    <Grid.Root width="100%" gap={4}>
                      {values.enabled && (
                        <Grid.Item col={4} xs={12} alignItems="flex-start">
                          <Field
                            error={errors?.isPrivate}
                            label={'page.settings.sections.form.base.isPrivate.label'}
                            hint={formatMessage({
                              id: `${camelCase(PLUGIN_ID)}.page.settings.sections.form.base.isPrivate.hint`,
                            })}
                          >
                            <Toggle
                              disabled={!values.urlEndpoint}
                              checked={values.isPrivate}
                              offLabel={formatMessage({
                                id: 'app.components.ToggleCheckbox.off-label',
                                defaultMessage: 'Off',
                              })}
                              onLabel={formatMessage({
                                id: 'app.components.ToggleCheckbox.on-label',
                                defaultMessage: 'On',
                              })}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                handleChange({
                                  target: { name: 'isPrivate', value: e.target.checked },
                                });
                              }}
                            />
                          </Field>
                        </Grid.Item>
                      )}
                      {values.enabled && values.isPrivate && (
                        <Grid.Item col={8} xs={12} alignItems="flex-start">
                          <Field
                            error={errors?.expiry}
                            label={'page.settings.sections.form.base.expiry.label'}
                            hint={formatMessage({
                              id: `${camelCase(PLUGIN_ID)}.page.settings.sections.form.base.expiry.hint`,
                            })}
                          >
                            <NumberInput
                              name="expiry"
                              value={values.expiry}
                              onValueChange={(e: number) => {
                                handleChange({
                                  target: { name: 'expiry', value: e },
                                });
                              }}
                              min="0"
                            />
                          </Field>
                        </Grid.Item>
                      )}
                    </Grid.Root>
                  </Flex>
                </Box>
                <Box {...boxDefaultProps}>
                  <Flex width="100%" direction="column" alignItems="flex-start" gap={4}>
                    <Flex width="100%" direction="column" alignItems="flex-start" gap={2}>
                      <Typography variant="delta" tag="h2">
                        {getTranslated('page.settings.sections.form.upload.title')}
                      </Typography>
                    </Flex>
                    <Grid.Root width="100%" gap={4}>
                      <Grid.Item col={4} xs={12} alignItems="flex-start">
                        <Field
                          error={errors.uploadEnabled}
                          label={'page.settings.sections.form.upload.enabled.label'}
                          hint={formatMessage({
                            id: `${camelCase(PLUGIN_ID)}.page.settings.sections.form.upload.enabled.hint`,
                          })}
                        >
                          <Toggle
                            checked={values.uploadEnabled}
                            offLabel={formatMessage({
                              id: 'app.components.ToggleCheckbox.off-label',
                              defaultMessage: 'Off',
                            })}
                            onLabel={formatMessage({
                              id: 'app.components.ToggleCheckbox.on-label',
                              defaultMessage: 'On',
                            })}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                              handleChange({
                                target: { name: 'uploadEnabled', value: e.target.checked },
                              });
                            }}
                          />
                        </Field>
                      </Grid.Item>
                      {values.uploadEnabled && (
                        <Grid.Item col={4} xs={12} alignItems="flex-start">
                          <Field
                            error={errors.publicKey}
                            label={'page.settings.sections.form.upload.publicKey.label'}
                            hint={
                              <>
                                {formatMessage({
                                  id: `${camelCase(PLUGIN_ID)}.page.settings.sections.form.upload.publicKey.hint`,
                                })}
                                <br />
                                <br />
                                {formatMessage(
                                  {
                                    id: `${camelCase(PLUGIN_ID)}.page.settings.sections.form.upload.publicKey.example`,
                                  },
                                  {
                                    example: <Code>public_xxxxxxxxxxxxxxxxxxxxxxxxxxxx</Code>,
                                  }
                                )}
                              </>
                            }
                          >
                            <NativeField.Input
                              type="text"
                              name="publicKey"
                              value={values.publicKey}
                              onChange={handleChange}
                              required
                            />
                          </Field>
                        </Grid.Item>
                      )}
                      {values.uploadEnabled && (
                        <Grid.Item col={4} xs={12} alignItems="flex-start">
                          <Field
                            error={errors.privateKey}
                            label={'page.settings.sections.form.upload.privateKey.label'}
                            hint={
                              <>
                                {formatMessage({
                                  id: `${camelCase(PLUGIN_ID)}.page.settings.sections.form.upload.privateKey.hint`,
                                })}
                                <br />
                                <br />
                                {formatMessage(
                                  {
                                    id: `${camelCase(PLUGIN_ID)}.page.settings.sections.form.upload.privateKey.example`,
                                  },
                                  {
                                    example: <Code>private_xxxxxxxxxxxxxxxxxxxxxxxxxxxx</Code>,
                                  }
                                )}
                              </>
                            }
                          >
                            <NativeField.Input
                              type="password"
                              name="privateKey"
                              value={values.privateKey}
                              onChange={handleChange}
                              required
                            />
                          </Field>
                        </Grid.Item>
                      )}
                    </Grid.Root>
                  </Flex>
                </Box>
                {values.uploadEnabled &&
                  (() => {
                    // Ensure uploadOptions exists
                    const uploadOptions = values.uploadOptions || {
                      tags: [],
                      customCoordinates: '',
                      overwriteTags: false,
                      overwriteCustomMetadata: false,
                      checks: '',
                    };

                    return (
                      <Box {...boxDefaultProps}>
                        <Flex width="100%" direction="column" alignItems="flex-start" gap={4}>
                          <Flex width="100%" direction="column" alignItems="flex-start" gap={2}>
                            <Typography variant="delta" tag="h2">
                              {getTranslated(
                                'page.settings.sections.form.uploadOptions.title',
                                'Upload Options'
                              )}
                            </Typography>
                            <Typography variant="epsilon" textColor="neutral600">
                              {getTranslated(
                                'page.settings.sections.form.uploadOptions.description',
                                'Configure options that will be used when uploading files to ImageKit.'
                              )}
                            </Typography>
                          </Flex>
                          <Grid.Root width="100%" gap={4}>
                            <Grid.Item col={12} xs={12} alignItems="flex-start">
                              <Field
                                error={errors?.uploadOptions?.folder}
                                label={'page.settings.sections.form.uploadOptions.folder.label'}
                                hint={formatMessage({
                                  id: `${camelCase(PLUGIN_ID)}.page.settings.sections.form.uploadOptions.folder.hint`,
                                  defaultMessage:
                                    'Base folder path in ImageKit where files will be uploaded. This will be combined with Strapi folders if they exist.',
                                })}
                              >
                                <NativeField.Input
                                  type="text"
                                  name="uploadOptions.folder"
                                  value={uploadOptions.folder || ''}
                                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                    setValues(
                                      {
                                        ...values,
                                        uploadOptions: {
                                          ...uploadOptions,
                                          folder: e.target.value,
                                        },
                                      },
                                      false
                                    );
                                  }}
                                  placeholder="/path/to/folder"
                                />
                              </Field>
                            </Grid.Item>

                            <Grid.Item col={8} xs={12} alignItems="flex-start">
                              <Field
                                error={errors?.uploadOptions?.tags}
                                label={'page.settings.sections.form.uploadOptions.tags.label'}
                                hint={formatMessage({
                                  id: `${camelCase(PLUGIN_ID)}.page.settings.sections.form.uploadOptions.tags.hint`,
                                  defaultMessage:
                                    'Comma separated list of tags to apply to the uploaded file.',
                                })}
                              >
                                <NativeField.Input
                                  type="text"
                                  name="uploadOptions.tags"
                                  value={uploadOptions.tags?.join(',') || ''}
                                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                    const tagsArray = e.target.value
                                      ? e.target.value.split(',').map((tag: string) => tag.trim())
                                      : [];
                                    setValues(
                                      {
                                        ...values,
                                        uploadOptions: {
                                          ...uploadOptions,
                                          tags: tagsArray,
                                        },
                                      },
                                      false
                                    );
                                  }}
                                  placeholder="tag1, tag2, tag3"
                                />
                              </Field>
                            </Grid.Item>

                            <Grid.Item col={4} xs={12} alignItems="flex-start">
                              <Field
                                error={errors?.uploadOptions?.overwriteTags}
                                label={
                                  'page.settings.sections.form.uploadOptions.overwriteTags.label'
                                }
                                hint={formatMessage({
                                  id: `${camelCase(PLUGIN_ID)}.page.settings.sections.form.uploadOptions.overwriteTags.hint`,
                                  defaultMessage:
                                    'If set to true, existing tags will be overwritten.',
                                })}
                              >
                                <Toggle
                                  checked={uploadOptions.overwriteTags || false}
                                  offLabel={formatMessage({
                                    id: 'app.components.ToggleCheckbox.off-label',
                                    defaultMessage: 'Off',
                                  })}
                                  onLabel={formatMessage({
                                    id: 'app.components.ToggleCheckbox.on-label',
                                    defaultMessage: 'On',
                                  })}
                                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                    setValues(
                                      {
                                        ...values,
                                        uploadOptions: {
                                          ...uploadOptions,
                                          overwriteTags: e.target.checked,
                                        },
                                      },
                                      false
                                    );
                                  }}
                                />
                              </Field>
                            </Grid.Item>
                            {/* 
                            <Grid.Item col={6} xs={12} alignItems="flex-start">
                              <Field
                                error={errors?.uploadOptions?.overwriteCustomMetadata}
                                label={
                                  'page.settings.sections.form.uploadOptions.overwriteCustomMetadata.label'
                                }
                                hint={formatMessage({
                                  id: `${camelCase(PLUGIN_ID)}.page.settings.sections.form.uploadOptions.overwriteCustomMetadata.hint`,
                                  defaultMessage:
                                    'If set to true, existing custom metadata will be overwritten.',
                                })}
                              >
                                <Toggle
                                  checked={uploadOptions.overwriteCustomMetadata || false}
                                  offLabel={formatMessage({
                                    id: 'app.components.ToggleCheckbox.off-label',
                                    defaultMessage: 'Off',
                                  })}
                                  onLabel={formatMessage({
                                    id: 'app.components.ToggleCheckbox.on-label',
                                    defaultMessage: 'On',
                                  })}
                                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                    setValues(
                                      {
                                        ...values,
                                        uploadOptions: {
                                          ...uploadOptions,
                                          overwriteCustomMetadata: e.target.checked,
                                        },
                                      },
                                      false
                                    );
                                  }}
                                />
                              </Field>
                            </Grid.Item> */}

                            <Grid.Item col={12} xs={12} alignItems="flex-start">
                              <Field
                                error={errors?.uploadOptions?.checks}
                                label={'page.settings.sections.form.uploadOptions.checks.label'}
                                hint={formatMessage({
                                  id: `${camelCase(PLUGIN_ID)}.page.settings.sections.form.uploadOptions.checks.hint`,
                                  defaultMessage:
                                    'Comma-separated list of the checks you want to run on the file.',
                                })}
                              >
                                <NativeField.Input
                                  type="text"
                                  name="uploadOptions.checks"
                                  value={uploadOptions.checks || ''}
                                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                    setValues(
                                      {
                                        ...values,
                                        uploadOptions: {
                                          ...uploadOptions,
                                          checks: e.target.value,
                                        },
                                      },
                                      false
                                    );
                                  }}
                                  placeholder="unsafe,text,invalid-image"
                                />
                              </Field>
                            </Grid.Item>
                          </Grid.Root>
                        </Flex>
                      </Box>
                    );
                  })()}
              </Flex>
            </Layouts.Content>
          </form>
        )}
      </Formik>
    </Page.Main>
  );
};

export default SettingsPage;
