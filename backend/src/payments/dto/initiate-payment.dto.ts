import { Transform } from "class-transformer";
import { IsOptional, IsString, Matches, IsUUID } from "class-validator";
import { KENYAN_E164_RE, toKenyanE164 } from "../../common/utils/phone.util";

const MAC = /^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/;

export class InitiatePaymentDto {
  @IsUUID()
  planId!: string;

  @IsString()
  @Matches(MAC, { message: "Invalid MAC address format" })
  macAddress!: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => toKenyanE164(value))
  @Matches(KENYAN_E164_RE, { message: "phone must be 07XXXXXXXXX or +254XXXXXXXXX" })
  phone?: string;
}
