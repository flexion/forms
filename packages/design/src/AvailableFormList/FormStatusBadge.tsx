import React from 'react';
import type { FormListItem } from '@flexion/forms-core';
import styles from './formStatusBadge.module.css';

type FormStatusBadgeProps = {
  form: FormListItem;
};

export const FormStatusBadge: React.FC<FormStatusBadgeProps> = ({ form }) => {
  const { latestJob } = form;

  // No job or completed job - no badge needed
  if (!latestJob || latestJob.status === 'completed') {
    return null;
  }

  const isProcessing = latestJob.status === 'processing';
  const isFailed = latestJob.status === 'failed';

  if (isProcessing) {
    return (
      <span
        className={`${styles.badge} ${styles.badgeProcessing}`}
        role="status"
        aria-live="polite"
      >
        <svg
          className={styles.spinner}
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <circle
            className={styles.spinnerCircle}
            cx="10"
            cy="10"
            r="8"
            fill="none"
            strokeWidth="2"
          />
        </svg>
        <span>Processing</span>
      </span>
    );
  }

  if (isFailed) {
    return (
      <span
        className={`${styles.badge} ${styles.badgeFailed}`}
        role="alert"
      >
        <svg
          className={styles.errorIcon}
          aria-hidden="true"
          focusable="false"
          role="img"
          viewBox="0 0 24 24"
        >
          <circle cx="12" cy="12" r="10" fill="currentColor" />
          <path
            fill="white"
            d="M11 7h2v6h-2V7zm0 8h2v2h-2v-2z"
          />
        </svg>
        <span>Import failed</span>
      </span>
    );
  }

  return null;
};
