import { Module } from "@nestjs/common";
import { MikroTikService } from "./mikrotik.service";

@Module({
  providers: [MikroTikService],
  exports: [MikroTikService],
})
export class MikroTikModule {}
