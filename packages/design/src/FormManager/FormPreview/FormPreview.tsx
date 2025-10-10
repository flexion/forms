import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { mergeSession } from '@flexion/forms-core';

import Form from '../../Form/Form.js';
import { useRouteParams } from '../hooks.js';
import { useFormManagerStore } from '../store.js';

export const FormPreview = () => {
  const { context, setSession } = useFormManagerStore(state => ({
    context: state.context,
    setSession: state.setSession,
  }));
  const session = useFormManagerStore(state => state.session);
  const { routeParams, pathname } = useRouteParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (routeParams.page !== session.route?.params.page) {
      const newSession = mergeSession(session, {
        route: {
          ...session.route,
          params: { ...routeParams },
          url: session.route?.url || '',
        },
      });
      setSession(newSession);
    }
  }, [routeParams.page]);

  const handleSubmit = () => {
    // Simple navigation: just go to the next page
    const currentPage = Number(routeParams.page) || 0;
    const nextPage = currentPage + 1;
    const newParams = new URLSearchParams({
      ...routeParams,
      page: nextPage.toString(),
    });
    navigate(`${pathname}?${newParams.toString()}`);
  };

  return (
    <Form
      isPreview={true}
      context={context}
      session={session}
      onSubmit={handleSubmit}
    />
  );
};
