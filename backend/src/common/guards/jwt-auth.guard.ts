import { ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { isObservable } from "rxjs";
import { lastValueFrom } from "rxjs";
import { RedisService } from "../../redis/redis.service";

@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {
  constructor(private readonly redis: RedisService) {
    super();
  }

  override async canActivate(context: ExecutionContext): Promise<boolean> {
    const can = super.canActivate(context);
    const activated = await (isObservable(can) ? lastValueFrom(can) : can);
    if (!activated) return false;

    const req = context.switchToHttp().getRequest<{ user?: { jti?: string } }>();
    const jti = req.user?.jti;
    if (jti) {
      const blacklisted = await this.redis.getClient().get(`blacklist:${jti}`);
      if (blacklisted) {
        throw new UnauthorizedException("Token revoked");
      }
    }
    return true;
  }
}
