import { IsOptional, IsString, Matches, IsUUID } from "class-validator";

const MAC = /^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/;
const PHONE = /^\+254[0-9]{9}$/;

export class InitiatePaymentDto {
  @IsUUID()
  planId!: string;

  @IsString()
  @Matches(MAC, { message: "Invalid MAC address format" })
  macAddress!: string;

  @IsOptional()
  @IsString()
  @Matches(PHONE, { message: "phone must be E.164 +254XXXXXXXXX" })
  phone?: string;
}
