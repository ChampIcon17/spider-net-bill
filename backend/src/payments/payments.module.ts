import { Module } from "@nestjs/common";
import { PaymentsController } from "./payments.controller";
import { PaymentsService } from "./payments.service";
import { DarajaService } from "./daraja/daraja.service";
import { MikroTikModule } from "../mikrotik/mikrotik.module";

@Module({
  imports: [MikroTikModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, DarajaService],
})
export class PaymentsModule {}
