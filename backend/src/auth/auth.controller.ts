import { Body, Controller, HttpCode, Post, Req, UseGuards } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { Request } from "express";
import { AuthService } from "./auth.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { RefreshDto } from "./dto/refresh.dto";
import { LogoutDto } from "./dto/logout.dto";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RefreshJwtAuthGuard } from "../common/guards/refresh-jwt.guard";
import type { RefreshJwtPayload } from "./strategies/jwt-refresh.strategy";

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post("register")
  @HttpCode(201)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Post("login")
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @Post("refresh")
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @UseGuards(RefreshJwtAuthGuard)
  refresh(@Req() req: Request & { user: RefreshJwtPayload }, @Body() body: RefreshDto) {
    return this.auth.refreshTokens(req.user.sub, body.refreshToken);
  }

  @Post("logout")
  @UseGuards(JwtAuthGuard)
  logout(
    @Req() req: Request & { headers: { authorization?: string } },
    @Body() body: LogoutDto,
  ) {
    const authHeader = req.headers.authorization;
    const accessToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : undefined;
    return this.auth.logout(accessToken, body.refreshToken);
  }
}
