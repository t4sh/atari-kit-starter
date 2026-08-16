const rawPrefix = process.env.ELEVENTY_PATH_PREFIX || '';
const pathPrefix = rawPrefix ? `/${rawPrefix.replace(/^\/+|\/+$/g, '')}` : '';
const defaultBaseUrl = `http://localhost:3000${pathPrefix}`;

module.exports = {
  name: process.env.SITE_NAME || '{{PROJECT_NAME}}',
  description: process.env.SITE_DESCRIPTION || 'TODO: Describe your project',
  author: process.env.SITE_AUTHOR || 'TODO: Your name',
  baseUrl: (process.env.SITE_BASE_URL || defaultBaseUrl).replace(/\/$/, ''),
  pathPrefix,
  environment: process.env.NODE_ENV || 'development',
  indexable: process.env.SITE_INDEXABLE === 'true',
  compiledTailwind: process.env.TAILWIND_MODE === 'compiled',
  analyticsEnabled: process.env.SITE_ANALYTICS_ENABLED === 'true',
};
