import { Controller, Get, HttpCode, ServiceUnavailableException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { RedisService } from "../redis/redis.service";

@Controller("health")
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  @Get()
  async check() {
    let dbOk = false;
    let redisOk = false;
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      dbOk = true;
    } catch {
      dbOk = false;
    }
    redisOk = await this.redis.ping();

    if (dbOk && redisOk) {
      return {
        status: "ok",
        db: "connected",
        redis: "connected",
        timestamp: new Date().toISOString(),
      };
    }

    throw new ServiceUnavailableException({
      status: "degraded",
      db: dbOk ? "connected" : "disconnected",
      redis: redisOk ? "connected" : "disconnected",
      timestamp: new Date().toISOString(),
    });
  }
}
