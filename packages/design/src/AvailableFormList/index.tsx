import React, { useEffect, useState, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';

import { type FormService, type FormListItem } from '@flexion/forms-core';

import * as AppRoutes from '../FormManager/routes.js';
import { FormStatusBadge } from './FormStatusBadge.js';

export type UrlForForm = (id: string) => string | null;
export type UrlForFormManager = UrlForForm;

export default function AvailableFormList({
  formService,
  urlForForm,
  urlForFormManager,
}: {
  formService: FormService;
  urlForForm: UrlForForm;
  urlForFormManager: UrlForFormManager;
}) {
  const [forms, setForms] = useState<FormListItem[]>([]);
  const location = useLocation();
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const loadForms = React.useCallback(() => {
    formService.getFormList().then(result => {
      if (result.success) {
        setForms(result.data);
      }
    });
  }, [formService]);

  useEffect(() => {
    loadForms();
  }, [location.pathname, location.hash, location.key, loadForms]);

  // Poll if any forms are processing
  useEffect(() => {
    const hasProcessingForms = forms.some(
      form => form.latestJob?.status === 'processing'
    );

    // Clear any existing interval
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }

    // Start polling if needed
    if (hasProcessingForms) {
      pollIntervalRef.current = setInterval(() => {
        loadForms();
      }, 3000); // Poll every 3 seconds
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [forms, loadForms]);

  return (
    <>
      <section className="padding-y-3 desktop:margin-top-10 border-base-lighter border-y">
        <div className="grid-container">
          <div className="grid-row flex-justify-center">
            <div className="grid-col-12 tablet:grid-col-12 desktop:grid-col-12">
              <div className="bg-white padding-y-2 padding-x-3 border border-base-lighter">
                <h1>My Forms</h1>
                <FormList
                  forms={forms}
                  urlForForm={urlForForm}
                  urlForFormManager={urlForFormManager}
                />
              </div>
            </div>
          </div>
        </div>
      </section>
      <div className="grid-container usa-section">
        <p>
          <Link to={AppRoutes.GuidedFormCreation.path} className="usa-button">
            Create New
          </Link>
        </p>
        <p>
          <DebugTools />
        </p>
      </div>
    </>
  );
}

const FormList = ({
  forms,
  urlForForm,
  urlForFormManager,
}: {
  forms: FormListItem[];
  urlForForm: UrlForForm;
  urlForFormManager: UrlForFormManager;
}) => {
  return (
    <table className="usa-table usa-table--stacked form-list-table">
      <thead>
        <tr>
          <th className="mobile-lg:grid-col-4" scope="col">
            Form title
          </th>
          <th className="mobile-lg:grid-col-4" scope="col">
            Description
          </th>
          <th className="mobile-lg:grid-col-4" scope="col">
            Actions
          </th>
        </tr>
      </thead>
      <tbody>
        {!forms.length ? (
          <tr>
            <th data-label="Form title" scope="row">
              There are no forms here yet
            </th>
            <td data-label="Description">{''}</td>
            <td data-label="Actions">{''}</td>
          </tr>
        ) : (
          forms.map((form, index) => (
            <FormRow
              key={form.id || index}
              form={form}
              urlForForm={urlForForm}
              urlForFormManager={urlForFormManager}
            />
          ))
        )}
      </tbody>
    </table>
  );
};

const FormRow = ({
  form,
  urlForForm,
  urlForFormManager,
}: {
  form: FormListItem;
  urlForForm: UrlForForm;
  urlForFormManager: UrlForFormManager;
}) => {
  const [showError, setShowError] = React.useState(false);

  return (
    <>
      <tr>
        <th data-label="Form title" scope="row">
          <div
            className="display-flex flex-align-center flex-wrap"
            style={{ gap: '0.5rem' }}
          >
            <span>{form.title}</span>
            <FormStatusBadge form={form} />
          </div>
        </th>
        <td data-label="Description">{form.description}</td>
        <td data-label="Actions">
          <FormActions
            form={form}
            urlForForm={urlForForm}
            urlForFormManager={urlForFormManager}
          />
        </td>
      </tr>
      {form.latestJob?.status === 'failed' && form.latestJob && (
        <tr>
          <td colSpan={3}>
            <div className="usa-alert usa-alert--error usa-alert--slim margin-top-1">
              <div className="usa-alert__body">
                <p className="usa-alert__text margin-y-0">
                  <strong>Import error:</strong>{' '}
                  {form.latestJob.errorMessage ||
                    'An error occurred while processing this form.'}{' '}
                  <button
                    type="button"
                    className="usa-button usa-button--unstyled"
                    onClick={() => setShowError(!showError)}
                  >
                    {showError ? 'Hide details' : 'Show details'}
                  </button>
                </p>
                {showError && form.latestJob.errorMessage && (
                  <details className="margin-top-1">
                    <summary>Technical details</summary>
                    <pre className="font-mono-2xs margin-top-1 padding-1 bg-base-lightest">
                      {form.latestJob.errorMessage}
                    </pre>
                  </details>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

const FormActions = ({
  form,
  urlForForm,
  urlForFormManager,
}: {
  form: FormListItem;
  urlForForm: UrlForForm;
  urlForFormManager: UrlForFormManager;
}) => {
  const formUrl = urlForForm(form.id);
  const isProcessing = form.latestJob?.status === 'processing';

  return (
    <div className="grid-row grid-gap-md">
      {formUrl && !isProcessing && (
        <a href={formUrl} title={form.title} className="grid-col-auto">
          Go to form
        </a>
      )}
      <a
        href={`${urlForFormManager(form.id)}/create`}
        className="grid-col-auto"
        aria-label={
          isProcessing
            ? `View processing status for ${form.title}`
            : `Edit ${form.title}`
        }
      >
        {isProcessing ? 'View' : 'Edit'}
      </a>
      <a
        href={`${urlForFormManager(form.id)}/delete`}
        className="grid-col-auto"
      >
        Delete
      </a>
    </div>
  );
};

const DebugTools = () => {
  return (
    <button
      className="usa-button"
      onClick={() => {
        console.warn('clearing localStorage...');
        window.localStorage.clear();
        window.location.reload();
      }}
    >
      Delete all demo data (clear browser local storage)
    </button>
  );
};
