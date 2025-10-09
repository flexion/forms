import { useState, useEffect, useRef } from 'react';
import type {
  Blueprint,
  FormService,
  FormStatusResponse,
} from '@flexion/forms-core';
import { useFormStatus } from './useFormStatus.js';

type UseBlueprintWithStatusResult = {
  form: Blueprint | null;
  status: FormStatusResponse | null;
  isLoading: boolean;
  isProcessing: boolean;
  error: string | null;
};

/**
 * Combined hook that loads a form blueprint and monitors its processing status.
 * Returns both the form data and status information, automatically polling
 * when the form is being processed.
 */
export const useBlueprintWithStatus = (
  formId: string | undefined,
  formService: FormService
): UseBlueprintWithStatusResult => {
  const [form, setForm] = useState<Blueprint | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(true);
  const previousStatusRef = useRef<string | null>(null);

  const {
    status,
    isLoading: statusLoading,
    error: statusError,
  } = useFormStatus(formId, formService);

  const currentStatus = status?.latestJob?.status || null;

  // Load the form initially
  useEffect(() => {
    if (!formId) {
      setFormLoading(false);
      return;
    }

    setFormLoading(true);
    formService.getForm(formId).then(result => {
      if (result.success) {
        setForm(result.data);
        setFormError(null);
      } else {
        console.error('Error loading form', result.error);
        setFormError('Failed to load form');
      }
      setFormLoading(false);
    });
  }, [formId]);

  // Reload form when processing completes (transition from 'processing' to 'completed')
  useEffect(() => {
    const previousStatus = previousStatusRef.current;
    const hasTransitionedToCompleted =
      previousStatus === 'processing' && currentStatus === 'completed';

    if (hasTransitionedToCompleted && formId) {
      console.log('Processing completed, reloading form...');
      setFormLoading(true);
      formService.getForm(formId).then(result => {
        if (result.success) {
          console.log(
            'Form reloaded successfully with patterns:',
            Object.keys(result.data.patterns).length
          );
          setForm(result.data);
          setFormError(null);
        } else {
          console.error('Failed to reload form:', result.error);
          setFormError('Failed to load form');
        }
        setFormLoading(false);
      });
    }

    // Update the previous status ref
    previousStatusRef.current = currentStatus;
  }, [currentStatus, formId]);

  const isProcessing = currentStatus === 'processing';
  const isLoading = formLoading || statusLoading;
  const error = formError || statusError;

  return {
    form,
    status,
    isLoading,
    isProcessing,
    error,
  };
};
