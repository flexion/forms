import React from 'react';

import { type ParagraphProps } from '@flexion/forms-core';

import { type PatternComponent } from '../../types.js';

const FormSummary: PatternComponent<ParagraphProps> = props => {
  return (
    <>
      <p className="maxw-tablet">{props.text}</p>
    </>
  );
};
export default FormSummary;
