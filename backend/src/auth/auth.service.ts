import { Injectable, UnauthorizedException, ConflictException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { Role, User } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";
import { PrismaService } from "../prisma/prisma.service";
import { UsersService } from "../users/users.service";
import { RedisService } from "../redis/redis.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";

type AccessPayload = {
  sub: string;
  phone: string;
  role: Role;
  jti: string;
};

type RefreshPayload = {
  sub: string;
  phone: string;
  role: Role;
  type: "refresh";
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly redis: RedisService,
  ) {}

  private accessSecret(): string {
    return this.config.get<string>("JWT_SECRET")!;
  }

  private refreshSecret(): string {
    return this.config.get<string>("JWT_REFRESH_SECRET")!;
  }

  private accessExpiresIn(): string {
    return this.config.get<string>("JWT_EXPIRES_IN")!;
  }

  private refreshExpiresIn(): string {
    return this.config.get<string>("JWT_REFRESH_EXPIRES_IN")!;
  }

  private refreshTtlMs(): number {
    const s = this.refreshExpiresIn();
    const m = /^(\d+)([smhd])$/i.exec(s.trim());
    if (!m) return 7 * 24 * 60 * 60 * 1000;
    const n = parseInt(m[1]!, 10);
    const unit = m[2]!.toLowerCase();
    const sec =
      unit === "s" ? n : unit === "m" ? n * 60 : unit === "h" ? n * 3600 : n * 86400;
    return sec * 1000;
  }

  async register(dto: RegisterDto) {
    const existing = await this.users.findByPhone(dto.phone);
    if (existing) {
      throw new ConflictException("Phone already registered");
    }
    const hashedPassword = await this.users.hashPassword(dto.password);
    const user = await this.users.create({
      phone: dto.phone,
      hashedPassword,
      name: dto.name,
    });
    const tokens = await this.issueTokenPair(user);
    return {
      user: this.users.toPublic(user),
      ...tokens,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.users.findByPhone(dto.phone);
    if (!user || !(await this.users.comparePassword(dto.password, user.hashedPassword))) {
      throw new UnauthorizedException("Invalid credentials");
    }
    const tokens = await this.issueTokenPair(user);
    return {
      user: this.users.toPublic(user),
      ...tokens,
    };
  }

  async issueTokenPair(user: User): Promise<{ accessToken: string; refreshToken: string }> {
    const jti = uuidv4();
    const accessPayload: AccessPayload = {
      sub: user.id,
      phone: user.phone,
      role: user.role,
      jti,
    };
    const accessToken = this.jwt.sign(accessPayload, {
      secret: this.accessSecret(),
      expiresIn: this.accessExpiresIn(),
    });

    const refreshPayload: RefreshPayload = {
      sub: user.id,
      phone: user.phone,
      role: user.role,
      type: "refresh",
    };
    const refreshToken = this.jwt.sign(refreshPayload, {
      secret: this.refreshSecret(),
      expiresIn: this.refreshExpiresIn(),
    });

    const expiresAt = new Date(Date.now() + this.refreshTtlMs());
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt,
      },
    });

    return { accessToken, refreshToken };
  }

  async refreshTokens(userId: string, refreshTokenString: string) {
    const stored = await this.prisma.refreshToken.findFirst({
      where: { userId, token: refreshTokenString, revoked: false },
    });
    if (!stored || stored.expiresAt < new Date()) {
      throw new UnauthorizedException("Invalid or revoked refresh token");
    }

    const user = await this.users.findById(userId);
    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revoked: true },
    });

    return this.issueTokenPair(user);
  }

  async logout(accessToken: string | undefined, refreshTokenString: string) {
    const rt = await this.prisma.refreshToken.findFirst({
      where: { token: refreshTokenString },
    });
    if (rt) {
      await this.prisma.refreshToken.update({
        where: { id: rt.id },
        data: { revoked: true },
      });
    }

    if (accessToken) {
      try {
        const decoded = this.jwt.decode(accessToken) as { jti?: string; exp?: number } | null;
        const jti = decoded?.jti;
        const exp = decoded?.exp;
        if (jti && exp) {
          const ttlSec = Math.max(0, exp - Math.floor(Date.now() / 1000));
          if (ttlSec > 0) {
            await this.redis.getClient().set(`blacklist:${jti}`, "1", "EX", ttlSec);
          }
        }
      } catch {
        /* ignore decode errors */
      }
    }
    return { message: "Logged out" };
  }
}
