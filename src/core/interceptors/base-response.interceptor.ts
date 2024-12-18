import {
  Injectable,
  CallHandler,
  NestInterceptor,
  ExecutionContext,
} from '@nestjs/common';
import { Response } from 'express';
import { Observable, map } from 'rxjs';
import { BaseResponse } from '../base/base-response.model';

@Injectable()
export class BaseResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        const ctx = context.switchToHttp();
        const resp = ctx.getResponse() as Response;
        return new BaseResponse(
          data,
          resp.statusCode >= 300 ? resp.statusMessage : undefined,
          resp.statusCode,
        );
      }),
    );
  }
}
