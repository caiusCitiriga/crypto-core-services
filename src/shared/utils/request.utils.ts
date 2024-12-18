import { Request } from 'express';

export class RequestUtils {
  static getRequestLogString(req: Request): string {
    const origin = req.get('origin') || req.get('host'); // host is for requests from DO LB
    const id = `From: ${origin}`;
    return `\n${id}\n[ ${req.method} ] ${req.path}\n`;
  }
}
