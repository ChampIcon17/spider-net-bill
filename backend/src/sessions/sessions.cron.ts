import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { SessionsService } from "./sessions.service";

@Injectable()
export class SessionsCron {
  private readonly logger = new Logger(SessionsCron.name);

  constructor(private readonly sessions: SessionsService) {}

  @Cron("*/5 * * * *")
  async handle() {
    try {
      await this.sessions.expireDueSessions();
    } catch (e) {
      this.logger.error("Session expiry cron failed", e instanceof Error ? e.stack : e);
    }
  }
}
