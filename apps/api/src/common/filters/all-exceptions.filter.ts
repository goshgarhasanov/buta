import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response, Request } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Daxili server xətası';

    const errorBody = {
      type: `https://buta.az/errors/${status}`,
      title: typeof message === 'string' ? message : (message as any).message ?? 'Xəta',
      status,
      detail: typeof message === 'object' ? (message as any).message ?? message : undefined,
      instance: request.url,
      timestamp: new Date().toISOString(),
    };

    if (status >= 500) {
      this.logger.error(
        { err: exception, path: request.url, method: request.method },
        'Server xətası',
      );
    }

    response.status(status).type('application/problem+json').json(errorBody);
  }
}
