import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { isString } from 'class-validator';
import { Request } from 'express';
import { Observable } from 'rxjs';
import { RequestUtils } from 'src/shared/utils/request.utils';
import { Configs } from '../config/config.enum';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest() as Request;

    if (req.path.includes('status-check')) return next.handle();

    if (Configs.verboseRequestsLogging) {
      let logString = RequestUtils.getRequestLogString(req);
      const user = req['user'];
      if (!!user) {
        logString += `\nUser UID: ${user.uid}`;
        logString += `\nUser email: ${user?.info?.email ?? 'N/A'}\n`;
      }

      logString += `Query: ${JSON.stringify(req.query)}`;
      logString += `\nParams: ${JSON.stringify(req.params)}`;
      logString += `\nBody: ${isString(req.body) ? req.body : JSON.stringify(req.body)}`;
      logString += `\n${'#'.repeat(50)}\n`;
      this.logger.log(logString);
    } else {
      this.logger.log(RequestUtils.getRequestLogString(req));
    }

    return next.handle();
  }
}
