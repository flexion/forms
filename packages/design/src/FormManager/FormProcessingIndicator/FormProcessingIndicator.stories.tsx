import type { Meta, StoryObj } from '@storybook/react';
import { FormProcessingIndicator } from './FormProcessingIndicator.js';

const meta = {
  title: 'FormManager/FormProcessingIndicator',
  component: FormProcessingIndicator,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof FormProcessingIndicator>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The processing indicator shown immediately after PDF upload.
 * Shows an animated spinner, progress steps, and elapsed time.
 */
export const Processing: Story = {
  args: {
    formId: 'test-form-123',
    status: {
      formId: 'test-form-123',
      formStatus: 'draft',
      latestJob: {
        id: 'job-123',
        jobType: 'import-pdf',
        status: 'processing',
        createdAt: new Date(Date.now() - 15000).toISOString(), // 15 seconds ago
      },
    },
  },
};

/**
 * Processing state after 45 seconds (approaching the upper end of expected time).
 */
export const ProcessingLongRunning: Story = {
  args: {
    formId: 'test-form-456',
    status: {
      formId: 'test-form-456',
      formStatus: 'draft',
      latestJob: {
        id: 'job-456',
        jobType: 'import-pdf',
        status: 'processing',
        createdAt: new Date(Date.now() - 45000).toISOString(), // 45 seconds ago
      },
    },
  },
};

/**
 * Processing state after more than a minute (exceeding expected time).
 */
export const ProcessingVeryLongRunning: Story = {
  args: {
    formId: 'test-form-789',
    status: {
      formId: 'test-form-789',
      formStatus: 'draft',
      latestJob: {
        id: 'job-789',
        jobType: 'import-pdf',
        status: 'processing',
        createdAt: new Date(Date.now() - 90000).toISOString(), // 90 seconds ago
      },
    },
  },
};

/**
 * Failed processing state with generic error message.
 */
export const Failed: Story = {
  args: {
    formId: 'test-form-error',
    status: {
      formId: 'test-form-error',
      formStatus: 'draft',
      latestJob: {
        id: 'job-error',
        jobType: 'import-pdf',
        status: 'failed',
        createdAt: new Date(Date.now() - 30000).toISOString(),
        completedAt: new Date(Date.now() - 5000).toISOString(),
      },
    },
  },
};

/**
 * Failed processing state with specific error message.
 */
export const FailedWithMessage: Story = {
  args: {
    formId: 'test-form-error-msg',
    status: {
      formId: 'test-form-error-msg',
      formStatus: 'draft',
      latestJob: {
        id: 'job-error-msg',
        jobType: 'import-pdf',
        status: 'failed',
        createdAt: new Date(Date.now() - 30000).toISOString(),
        completedAt: new Date(Date.now() - 5000).toISOString(),
        errorMessage:
          'Unable to extract text from PDF. The document may be image-based or corrupted.',
      },
    },
  },
};

/**
 * Completed state - component should not render anything.
 */
export const Completed: Story = {
  args: {
    formId: 'test-form-complete',
    status: {
      formId: 'test-form-complete',
      formStatus: 'ready',
      latestJob: {
        id: 'job-complete',
        jobType: 'import-pdf',
        status: 'completed',
        createdAt: new Date(Date.now() - 60000).toISOString(),
        completedAt: new Date(Date.now() - 5000).toISOString(),
      },
    },
  },
};

/**
 * No job state - component should not render anything.
 */
export const NoJob: Story = {
  args: {
    formId: 'test-form-no-job',
    status: {
      formId: 'test-form-no-job',
      formStatus: 'draft',
    },
  },
};
