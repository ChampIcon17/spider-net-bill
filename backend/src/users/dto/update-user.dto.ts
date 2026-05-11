import { IsOptional, IsString, MaxLength, MinLength, Matches } from "class-validator";

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[A-Z])(?=.*[0-9]).+$/, {
    message: "Password must contain at least one uppercase letter and one number",
  })
  password?: string;
}
