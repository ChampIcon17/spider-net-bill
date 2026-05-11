import { IsString, Matches, MinLength } from "class-validator";

const PHONE_RE = /^\+254[0-9]{9}$/;

export class LoginDto {
  @IsString()
  @Matches(PHONE_RE, { message: "phone must be E.164 +254XXXXXXXXX" })
  phone!: string;

  @IsString()
  @MinLength(1)
  password!: string;
}
