import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from "@nestjs/common";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger("HTTP");

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<{
      method: string;
      url: string;
      ip: string;
      user?: { sub?: string };
    }>();
    const start = Date.now();
    const userId = req.user?.sub;

    this.logger.log(`${req.method} ${req.url} ip=${req.ip} userId=${userId ?? "-"}`);

    return next.handle().pipe(
      tap({
        next: () => {
          const res = context.switchToHttp().getResponse<{ statusCode: number }>();
          const ms = Date.now() - start;
          this.logger.log(`${req.method} ${req.url} ${res.statusCode} ${ms}ms`);
        },
      }),
    );
  }
}
