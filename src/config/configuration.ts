export default () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '4000', 10),
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3001',
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/devWaves',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: process.env.JWT_EXPIRATION || '24h',
  },
  aws: {
    region: process.env.AWS_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  cognito: {
    clientId: process.env.AWS_COGNITO_CLIENT_ID,
    clientSecret: process.env.AWS_COGNITO_CLIENT_SECRET,
    userPoolId: process.env.AWS_COGNITO_USER_POOL_ID,
    domain: process.env.AWS_COGNITO_DOMAIN,
    identityPoolId: process.env.AWS_COGNITO_IDENTITY_POOL_ID,
    callbackUrl: process.env.COGNITO_CALLBACK_URL || 'http://localhost:4000/auth/cognito/callback',
    logoutUrl: process.env.COGNITO_LOGOUT_URL || 'http://localhost:3001',
    fromEmail: process.env.COGNITO_FROM_EMAIL,
  },
});
