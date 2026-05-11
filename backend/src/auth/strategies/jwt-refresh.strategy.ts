import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy, StrategyOptions } from "passport-jwt";
import { Request } from "express";
import { Role } from "@prisma/client";

export type RefreshJwtPayload = {
  sub: string;
  phone: string;
  role: Role;
  type?: string;
};

function extractRefreshFromBody(req: Request): string | null {
  const t = req.body?.refreshToken;
  return typeof t === "string" ? t : null;
}

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, "jwt-refresh") {
  constructor(config: ConfigService) {
    const opts: StrategyOptions = {
      jwtFromRequest: extractRefreshFromBody as StrategyOptions["jwtFromRequest"],
      ignoreExpiration: false,
      secretOrKey: config.get<string>("JWT_REFRESH_SECRET")!,
      passReqToCallback: false,
    };
    super(opts);
  }

  validate(payload: RefreshJwtPayload & { type?: string }): RefreshJwtPayload {
    return { sub: payload.sub, phone: payload.phone, role: payload.role };
  }
}
