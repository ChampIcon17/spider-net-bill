import { Injectable, Logger } from "@nestjs/common";
import type Redis from "ioredis";
import { RedisService } from "./redis.service";

type IncrementRecord = {
  totalHits: number;
  timeToExpire: number;
  isBlocked: boolean;
  timeToBlockExpire: number;
};

@Injectable()
export class RedisThrottlerStorage {
  private readonly logger = new Logger(RedisThrottlerStorage.name);
  private readonly client: Redis;

  constructor(redisService: RedisService) {
    this.client = redisService.getClient();
  }

  private counterKey(key: string, throttlerName: string): string {
    return `throttle:${throttlerName}:${key}`;
  }

  private blockKey(key: string, throttlerName: string): string {
    return `throttle:block:${throttlerName}:${key}`;
  }

  // Signature kept permissive to remain compatible across throttler versions.
  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration = 0,
    throttlerName = "default",
  ): Promise<IncrementRecord> {
    const counterKey = this.counterKey(key, throttlerName);
    const blockedKey = this.blockKey(key, throttlerName);

    try {
      const blockedTtlMs = await this.client.pttl(blockedKey);
      if (blockedTtlMs > 0) {
        return {
          totalHits: limit + 1,
          timeToExpire: blockedTtlMs,
          isBlocked: true,
          timeToBlockExpire: blockedTtlMs,
        };
      }

      const count = await this.client.incr(counterKey);
      if (count === 1) {
        await this.client.pexpire(counterKey, ttl);
      }
      const ttlMs = Math.max(0, await this.client.pttl(counterKey));
      const isBlocked = count > limit;

      let blockTtlMs = 0;
      if (isBlocked && blockDuration > 0) {
        // Set block key once, and preserve existing block if already present.
        const setRes = await this.client.set(blockedKey, "1", "PX", blockDuration, "NX");
        if (setRes === "OK") {
          blockTtlMs = blockDuration;
        } else {
          blockTtlMs = Math.max(0, await this.client.pttl(blockedKey));
        }
      }

      return {
        totalHits: count,
        timeToExpire: ttlMs,
        isBlocked,
        timeToBlockExpire: blockTtlMs,
      };
    } catch (error) {
      this.logger.error("Redis throttler increment failed; allowing request", error as Error);
      return {
        totalHits: 0,
        timeToExpire: ttl,
        isBlocked: false,
        timeToBlockExpire: 0,
      };
    }
  }
}
