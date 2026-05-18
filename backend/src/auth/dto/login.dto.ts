import { Transform } from "class-transformer";
import { IsString, Matches, MinLength } from "class-validator";
import { KENYAN_E164_RE, toKenyanE164 } from "../../common/utils/phone.util";

export class LoginDto {
  @IsString()
  @Transform(({ value }) => toKenyanE164(value))
  @Matches(KENYAN_E164_RE, { message: "phone must be 07XXXXXXXXX or +254XXXXXXXXX" })
  phone!: string;

  @IsString()
  @MinLength(1)
  password!: string;
}
