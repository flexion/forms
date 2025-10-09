import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

import { getGithubRepository } from './src/lib/github';

const githubRepository = await getGithubRepository(process.env);

// https://astro.build/config
export default defineConfig({
  base: addTrailingSlash(process.env.BASEURL || ''),
  integrations: [
    react({
      include: ['src/components/react/**'],
    }),
  ],
  security: {
    checkOrigin: true,
  },
  trailingSlash: 'always',
  vite: {
    define: {
      'import.meta.env.GITHUB': JSON.stringify(githubRepository),
    },
    resolve: {
      conditions: process.env.NODE_ENV === 'production'
        ? ['production', 'import', 'module', 'browser', 'default']
        : ['development', 'import', 'module', 'browser', 'default'],
    },
  },
});

function addTrailingSlash(path) {
  var lastChar = path.substr(-1);
  if (lastChar === '/') {
    return path;
  }
  return path + '/';
}
