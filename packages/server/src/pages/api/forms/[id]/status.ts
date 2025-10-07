import type { APIRoute } from 'astro';
import { getServerContext } from '../../../../config/astro.js';

export const GET: APIRoute = async context => {
  const ctx = await getServerContext(context);
  const formId = context.params.id;

  if (!formId) {
    return new Response('Form ID is required', { status: 400 });
  }

  const result = await ctx.formService.getFormStatus(formId);

  return new Response(JSON.stringify(result), {
    headers: {
      'Content-Type': 'application/json',
    },
    status: result.success ? 200 : result.error.status,
  });
};
