import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl, ip } = req;
    const startTime = Date.now();

    res.on('finish', () => {
      const { statusCode } = res;
      const duration = Date.now() - startTime;
      const timestamp = new Date().toISOString();

      this.logger.log(
        `[${timestamp}] ${method} ${originalUrl} - Status: ${statusCode} - Duration: ${duration}ms - IP: ${ip}`,
      );

      // Log additional details for errors
      if (statusCode >= 400) {
        this.logger.warn(
          `Error Response: ${method} ${originalUrl} - Status: ${statusCode}`,
        );
      }
    });

    next();
  }
}
