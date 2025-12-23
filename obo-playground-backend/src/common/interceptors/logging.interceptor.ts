import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const { method, url, body, query, params } = request;
    const userAgent = request.get('user-agent') || '';
    const ip = request.ip || 'unknown';

    const now = Date.now();
    this.logger.log(
      `Incoming Request: ${method} ${url} - ${ip} - ${userAgent}`,
    );

    if (body && typeof body === 'object' && Object.keys(body).length > 0) {
      this.logger.debug(`Request Body: ${JSON.stringify(body)}`);
    }

    if (query && typeof query === 'object' && Object.keys(query).length > 0) {
      this.logger.debug(`Query Params: ${JSON.stringify(query)}`);
    }

    if (
      params &&
      typeof params === 'object' &&
      Object.keys(params).length > 0
    ) {
      this.logger.debug(`Route Params: ${JSON.stringify(params)}`);
    }

    return next.handle().pipe(
      tap({
        next: () => {
          const response = context.switchToHttp().getResponse<Response>();
          const { statusCode } = response;
          const responseTime = Date.now() - now;

          this.logger.log(
            `Response: ${method} ${url} ${statusCode} - ${responseTime}ms`,
          );
        },
        error: (error: Error) => {
          const responseTime = Date.now() - now;
          this.logger.error(
            `Error Response: ${method} ${url} - ${responseTime}ms`,
            error.stack,
          );
        },
      }),
    );
  }
}
