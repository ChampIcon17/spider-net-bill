import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { ScheduleModule } from "@nestjs/schedule";
import { validateEnv } from "./config/configuration";
import { PrismaModule } from "./prisma/prisma.module";
import { RedisModule } from "./redis/redis.module";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { PlansModule } from "./plans/plans.module";
import { PaymentsModule } from "./payments/payments.module";
import { SessionsModule } from "./sessions/sessions.module";
import { MikroTikModule } from "./mikrotik/mikrotik.module";
import { HealthModule } from "./health/health.module";
import { CommonModule } from "./common/common.module";
import { RedisService } from "./redis/redis.service";
import { RedisThrottlerStorage } from "./redis/redis-throttler.storage";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    ThrottlerModule.forRootAsync({
      imports: [RedisModule],
      inject: [RedisService],
      useFactory: (redisService: RedisService) => ({
        throttlers: [
          {
            name: "default",
            ttl: 60000,
            limit: 10,
          },
        ],
        storage: new RedisThrottlerStorage(redisService) as unknown as never,
      }),
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    RedisModule,
    CommonModule,
    AuthModule,
    UsersModule,
    PlansModule,
    MikroTikModule,
    PaymentsModule,
    SessionsModule,
    HealthModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
