import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import * as crypto from 'node:crypto';

@Injectable()
export class HostawaySignatureGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    const signature = request.headers['x-hostaway-signature'] as string;
    if (!signature) {
      throw new UnauthorizedException('Missing Hostaway signature');
    }

    const secret = process.env.HOSTAWAY_WEBHOOK_SECRET;
    if (!secret) {
      throw new Error('HOSTAWAY_WEBHOOK_SECRET not configured');
    }

    const rawBody = (request as Request & { rawBody: string }).rawBody;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');

    if (signature !== expectedSignature) {
      throw new UnauthorizedException('Invalid Hostaway signature');
    }

    return true;
  }
}
