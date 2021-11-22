const LOCAL_CREDENTIALS = {
  driver: 'pg',
  user: process.env.DEVELOPMENT_PG_USER || 'withso',
  password: process.env.DEVELOPMENT_PG_PASSWORD || 'withso',
  host: process.env.DEVELOPMENT_PG_HOST || 'localhost',
  database: process.env.DEVELOPMENT_PG_DATABASE || 'withso',
  port: process.env.DEVELOPMENT_PG_PORT || process.env.LOCAL_PG_PORT || '5432',
};

const PROD_CREDENTIALS = {
  // These are run at build time, and are thus fetched from the Netlify admin panel
  driver: 'pg',
  user: process.env.PRODUCTION_PG_USER,
  password: process.env.PRODUCTION_PG_PASSWORD,
  host: process.env.PRODUCTION_PG_HOST,
  database: process.env.PRODUCTION_PG_DATABASE,
  port: process.env.PRODUCTION_PG_PORT,
};

const STAGING_CREDENTIALS = {
  driver: 'pg',
  user: process.env.STAGING_PG_USER,
  password: process.env.STAGING_PG_PASSWORD,
  host: process.env.STAGING_PG_HOST,
  database: process.env.STAGING_PG_DATABASE,
  port: process.env.STAGING_PG_PORT,
};

const TEST_CREDENTIALS = {
  driver: 'pg',
  user: process.env.TEST_PG_USER,
  password: process.env.TEST_PG_PASSWORD,
  host: process.env.TEST_PG_HOST,
  database: process.env.TEST_PG_DATABASE,
  port: process.env.TEST_PG_PORT,
};

const getCredentials = () => {
  switch (process.env.NODE_ENV) {
    case 'production':
      return PROD_CREDENTIALS;
    case 'development' || 'local':
      return LOCAL_CREDENTIALS;
    case 'preview':
      return STAGING_CREDENTIALS;
    case 'staging':
      return STAGING_CREDENTIALS;
    case 'branch-deploy':
      return STAGING_CREDENTIALS;
    case 'test':
      return TEST_CREDENTIALS;
    default:
      throw `unrecognized environment ${
        process.env.NODE_ENV
      } Env: ${JSON.stringify(process.env)}`;
  }
};

export default getCredentials();