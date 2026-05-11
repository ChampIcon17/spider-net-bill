import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { JwtStrategy } from "./strategies/jwt.strategy";
import { JwtRefreshStrategy } from "./strategies/jwt-refresh.strategy";
import { UsersModule } from "../users/users.module";
import { RefreshJwtAuthGuard } from "../common/guards/refresh-jwt.guard";

@Module({
  imports: [UsersModule, PassportModule.register({ defaultStrategy: "jwt" }), JwtModule.register({})],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtRefreshStrategy, RefreshJwtAuthGuard],
  exports: [AuthService],
})
export class AuthModule {}
