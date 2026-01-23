import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private logger = new Logger('Request');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const { method, url, body } = request;
    const timestamp = new Date().toISOString();

    this.logger.debug(
      `[${timestamp}] Incoming ${method} ${url}${body ? ' - Body: ' + JSON.stringify(body) : ''}`,
    );

    return next.handle().pipe(
      tap(() => {
        const response = context.switchToHttp().getResponse();
        const { statusCode } = response;
        const endTime = new Date().toISOString();

        this.logger.debug(
          `[${endTime}] Outgoing ${method} ${url} - Status: ${statusCode}`,
        );
      }),
      catchError((error) => {
        const errorTime = new Date().toISOString();
        this.logger.error(
          `[${errorTime}] Error in ${method} ${url} - ${error.message}`,
        );
        throw error;
      }),
    );
  }
}
