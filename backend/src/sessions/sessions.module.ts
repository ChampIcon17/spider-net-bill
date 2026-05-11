import { Module } from "@nestjs/common";
import { SessionsService } from "./sessions.service";
import { SessionsController } from "./sessions.controller";
import { SessionsCron } from "./sessions.cron";
import { MikroTikModule } from "../mikrotik/mikrotik.module";

@Module({
  imports: [MikroTikModule],
  controllers: [SessionsController],
  providers: [SessionsService, SessionsCron],
  exports: [SessionsService],
})
export class SessionsModule {}
