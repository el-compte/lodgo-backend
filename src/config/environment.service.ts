import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EnvironmentService {
  constructor(private configService: ConfigService) {}

  // Application
  get nodeEnv(): string {
    return this.configService.get<string>('NODE_ENV', 'development');
  }

  get port(): number {
    return this.configService.get<number>('PORT', 4000);
  }

  get clientUrl(): string {
    return this.configService.get<string>(
      'CLIENT_URL',
      'http://localhost:3001',
    );
  }

  // Database
  get mongodbUri(): string {
    return this.configService.get<string>(
      'MONGODB_URI',
      'mongodb://localhost:27017/devWaves',
    );
  }

  // JWT
  get jwtSecret(): string {
    return this.configService.get<string>('JWT_SECRET', 'your-secret-key');
  }

  get jwtExpiration(): string {
    return this.configService.get<string>('JWT_EXPIRATION', '24h');
  }

  // AWS Cognito
  get awsRegion(): string {
    return this.configService.get<string>('AWS_REGION', 'us-east-1');
  }

  get cognitoClientId(): string {
    return this.configService.get<string>('AWS_COGNITO_CLIENT_ID', '');
  }

  get cognitoClientSecret(): string {
    return this.configService.get<string>('AWS_COGNITO_CLIENT_SECRET', '');
  }

  get cognitoUserPoolId(): string {
    return this.configService.get<string>('AWS_COGNITO_USER_POOL_ID', '');
  }

  get cognitorDomain(): string {
    return this.configService.get<string>('AWS_COGNITO_DOMAIN', '');
  }

  get cognitoIdentityPoolId(): string {
    return this.configService.get<string>('AWS_COGNITO_IDENTITY_POOL_ID', '');
  }

  get cognitoCallbackUrl(): string {
    return this.configService.get<string>(
      'COGNITO_CALLBACK_URL',
      'http://localhost:4000/auth/cognito/callback',
    );
  }

  get cognitoLogoutUrl(): string {
    return this.configService.get<string>(
      'COGNITO_LOGOUT_URL',
      'http://localhost:3001',
    );
  }

  // AWS Credentials
  get awsAccessKeyId(): string {
    return this.configService.get<string>('AWS_ACCESS_KEY_ID', '');
  }

  get awsSecretAccessKey(): string {
    return this.configService.get<string>('AWS_SECRET_ACCESS_KEY', '');
  }

  // Email
  get cognitoFromEmail(): string {
    return this.configService.get<string>('COGNITO_FROM_EMAIL', '');
  }

  // Helper methods
  isProduction(): boolean {
    return this.nodeEnv === 'production';
  }

  isDevelopment(): boolean {
    return this.nodeEnv === 'development';
  }
}
