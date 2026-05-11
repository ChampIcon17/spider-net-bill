import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { Role } from "@prisma/client";

export type AccessJwtPayload = {
  sub: string;
  phone: string;
  role: Role;
  jti: string;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, "jwt") {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>("JWT_SECRET")!,
    });
  }

  validate(payload: AccessJwtPayload): AccessJwtPayload {
    return {
      sub: payload.sub,
      phone: payload.phone,
      role: payload.role,
      jti: payload.jti,
    };
  }
}
