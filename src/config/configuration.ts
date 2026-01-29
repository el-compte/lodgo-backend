export default () => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number.parseInt(process.env.PORT ?? '4000', 10),
  clientUrl: process.env.CLIENT_URL ?? 'http://localhost:3001',
  database: {
    uri: process.env.MONGODB_URI ?? 'mongodb://localhost:27017/devWaves',
  },
  jwt: {
    secret: process.env.JWT_SECRET ?? 'your-secret-key',
    expiresIn: process.env.JWT_EXPIRATION ?? '24h',
  },
  aws: {
    region: process.env.AWS_REGION ?? 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  cognito: {
    clientId: process.env.AWS_COGNITO_CLIENT_ID,
    clientSecret: process.env.AWS_COGNITO_CLIENT_SECRET,
    userPoolId: process.env.AWS_COGNITO_USER_POOL_ID,
    domain: process.env.AWS_COGNITO_DOMAIN,
    identityPoolId: process.env.AWS_COGNITO_IDENTITY_POOL_ID,
    callbackUrl:
      process.env.COGNITO_CALLBACK_URL ??
      'http://localhost:4000/auth/cognito/callback',
    logoutUrl: process.env.COGNITO_LOGOUT_URL ?? 'http://localhost:3001',
    fromEmail: process.env.COGNITO_FROM_EMAIL,
  },
  webhooks: {
    hostaway: {
      secret: process.env.HOSTAWAY_WEBHOOK_SECRET,
      rateLimit: {
        maxRequests: process.env.HOSTAWAY_RATE_LIMIT_MAX ?? '100',
        windowMs: process.env.HOSTAWAY_RATE_LIMIT_WINDOW ?? '60000',
      },
      retry: {
        retryAttempts: Number.parseInt(
          process.env.HOSTAWAY_WEBHOOK_RETRY_ATTEMPTS ?? '3',
          10,
        ),
        initialDelayMs: Number.parseInt(
          process.env.HOSTAWAY_WEBHOOK_INITIAL_RETRY_DELAY ?? '1000',
          10,
        ),
        maxDelayMs: Number.parseInt(
          process.env.HOSTAWAY_WEBHOOK_MAX_RETRY_DELAY ?? '30000',
          10,
        ),
        backoffMultiplier: parseFloat(
          process.env.HOSTAWAY_WEBHOOK_RETRY_BACKOFF ?? '2.0',
        ),
      },
    },
    guesty: {
      secret: process.env.GUESTY_WEBHOOK_SECRET,
      rateLimit: {
        maxRequests: process.env.GUESTY_RATE_LIMIT_MAX ?? '100',
        windowMs: process.env.GUESTY_RATE_LIMIT_WINDOW ?? '60000',
      },
      retry: {
        retryAttempts: Number.parseInt(
          process.env.GUESTY_WEBHOOK_RETRY_ATTEMPTS ?? '3',
          10,
        ),
        initialDelayMs: Number.parseInt(
          process.env.GUESTY_WEBHOOK_INITIAL_RETRY_DELAY ?? '1000',
          10,
        ),
        maxDelayMs: Number.parseInt(
          process.env.GUESTY_WEBHOOK_MAX_RETRY_DELAY ?? '30000',
          10,
        ),
        backoffMultiplier: parseFloat(
          process.env.GUESTY_WEBHOOK_RETRY_BACKOFF ?? '2.0',
        ),
      },
    },
  },
});
