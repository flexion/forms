import React, { useState, useEffect } from 'react';
import type { FormStatusResponse } from '@flexion/forms-core';
import styles from './formProcessingIndicator.module.css';

type FormProcessingIndicatorProps = {
  formId: string;
  status: FormStatusResponse;
};

export const FormProcessingIndicator: React.FC<
  FormProcessingIndicatorProps
> = ({ formId, status }) => {
  const { latestJob } = status;
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Don't show anything if no job or job is completed
  if (!latestJob || latestJob.status === 'completed') {
    return null;
  }

  const isProcessing = latestJob.status === 'processing';
  const isFailed = latestJob.status === 'failed';

  // Calculate elapsed time for processing jobs
  useEffect(() => {
    if (!isProcessing || !latestJob.createdAt) {
      return;
    }

    const startTime = new Date(latestJob.createdAt).getTime();

    const updateElapsed = () => {
      const now = Date.now();
      const elapsed = Math.floor((now - startTime) / 1000);
      setElapsedSeconds(elapsed);
    };

    // Update immediately
    updateElapsed();

    // Then update every second
    const interval = setInterval(updateElapsed, 1000);

    return () => clearInterval(interval);
  }, [isProcessing, latestJob.createdAt]);

  const formatElapsedTime = (seconds: number): string => {
    if (seconds < 60) {
      return `${seconds} second${seconds !== 1 ? 's' : ''}`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes} minute${minutes !== 1 ? 's' : ''}, ${remainingSeconds} second${remainingSeconds !== 1 ? 's' : ''}`;
  };

  return (
    <div className="grid-container">
      <div className="grid-row flex-justify-center margin-top-8">
        <div className="grid-col-12 tablet:grid-col-10 desktop:grid-col-8">
          {isProcessing && (
            <div
              className={`usa-alert usa-alert--info ${styles.processingAlert}`}
              role="status"
              aria-live="polite"
              aria-atomic="true"
            >
              <div className="usa-alert__body">
                <div className={styles.processingContent}>
                  <div className={styles.spinnerContainer}>
                    <svg
                      className={styles.spinner}
                      viewBox="0 0 50 50"
                      aria-hidden="true"
                    >
                      <circle
                        className={styles.spinnerTrack}
                        cx="25"
                        cy="25"
                        r="20"
                        fill="none"
                        strokeWidth="4"
                      />
                      <circle
                        className={styles.spinnerProgress}
                        cx="25"
                        cy="25"
                        r="20"
                        fill="none"
                        strokeWidth="4"
                      />
                    </svg>
                    <span className="usa-sr-only">Processing</span>
                  </div>
                  <div className={styles.processingText}>
                    <h3 className={`usa-alert__heading ${styles.heading}`}>
                      Processing your form
                    </h3>
                    <p className={styles.description}>
                      We&apos;re analyzing your PDF document and extracting form
                      fields. This process may take several minutes to complete.
                    </p>
                    <div className={styles.timeInfo}>
                      <p className={styles.elapsedTime}>
                        <strong>Elapsed time:</strong>{' '}
                        {formatElapsedTime(elapsedSeconds)}
                      </p>
                      {elapsedSeconds > 180 && (
                        <p className={styles.warningText}>
                          This is taking longer than usual. The process is still
                          running and should complete soon.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {isFailed && (
            <div className="usa-alert usa-alert--error" role="alert">
              <div className="usa-alert__body">
                <h3 className="usa-alert__heading">Processing failed</h3>
                <p className="usa-alert__text margin-top-2">
                  {latestJob.errorMessage ||
                    'An error occurred while processing your form. You can still edit the form manually.'}
                </p>
                <div className="margin-top-3">
                  <a
                    href={`#/forms/${formId}/edit`}
                    className="usa-button usa-button--secondary"
                  >
                    Edit form manually
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
