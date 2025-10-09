import { useState, useEffect, useRef } from 'react';
import type { FormService, FormStatusResponse } from '@flexion/forms-core';

type UseFormStatusResult = {
  status: FormStatusResponse | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
};

/**
 * Hook to poll form status. Automatically refreshes when form is processing.
 * Stops polling when processing is complete or failed.
 */
export const useFormStatus = (
  formId: string | undefined,
  formService: FormService,
  options?: {
    pollInterval?: number; // milliseconds, defaults to 2000 (2 seconds)
    enabled?: boolean; // whether to poll, defaults to true
  }
): UseFormStatusResult => {
  const [status, setStatus] = useState<FormStatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  const pollInterval = options?.pollInterval ?? 2000;
  const enabled = options?.enabled ?? true;

  const fetchStatus = async () => {
    if (!formId || !enabled) {
      return;
    }

    try {
      const result = await formService.getFormStatus(formId);

      if (!mountedRef.current) {
        return;
      }

      if (result.success) {
        setStatus(result.data);
        setError(null);
      } else {
        setError(result.error.message);
      }
    } catch (err) {
      if (!mountedRef.current) {
        return;
      }
      setError((err as Error).message);
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  const shouldPoll = (currentStatus: FormStatusResponse | null): boolean => {
    if (!currentStatus?.latestJob) {
      return false;
    }
    return currentStatus.latestJob.status === 'processing';
  };

  useEffect(() => {
    mountedRef.current = true;

    // Initial fetch
    fetchStatus();

    return () => {
      mountedRef.current = false;
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [formId, enabled]);

  // Set up polling based on status
  useEffect(() => {
    // Clear any existing interval
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }

    // Only poll if we should
    if (shouldPoll(status)) {
      pollIntervalRef.current = setInterval(() => {
        fetchStatus();
      }, pollInterval);
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [status, pollInterval, enabled]);

  return {
    status,
    isLoading,
    error,
    refetch: fetchStatus,
  };
};
