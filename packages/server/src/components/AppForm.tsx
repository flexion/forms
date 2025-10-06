import React from 'react';

import { defaultPatternComponents, Form } from '@flexion/forms-design';
import { type FormSession, defaultFormConfig } from '@flexion/forms-core';

type AppFormProps = {
  uswdsRoot: `${string}/`;
  session: FormSession;
};

export const AppForm = (props: AppFormProps) => {
  return (
    <Form
      context={{
        config: defaultFormConfig,
        components: defaultPatternComponents,
        uswdsRoot: props.uswdsRoot,
      }}
      session={props.session}
    />
  );
};
