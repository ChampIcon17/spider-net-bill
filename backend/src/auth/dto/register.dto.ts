import { IsOptional, IsString, Matches, MinLength, MaxLength } from "class-validator";

const PHONE_RE = /^\+254[0-9]{9}$/;

export class RegisterDto {
  @IsString()
  @Matches(PHONE_RE, { message: "phone must be E.164 +254XXXXXXXXX" })
  phone!: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[A-Z])(?=.*[0-9]).+$/, {
    message: "Password must contain at least one uppercase letter and one number",
  })
  password!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;
}
