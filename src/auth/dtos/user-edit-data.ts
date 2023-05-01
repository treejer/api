import { IsDate, IsEmail, IsOptional, IsString } from "class-validator";

export class UserEditDataDto {
  @IsOptional()
  @IsEmail()
  @IsString()
  email?;

  @IsOptional()
  @IsDate()
  emailVerifiedAt?;

  @IsOptional()
  @IsString()
  mobile?;

  @IsOptional()
  @IsString()
  mobileCountry?;

  @IsOptional()
  @IsString()
  mobileVerifiedAt?;
}
