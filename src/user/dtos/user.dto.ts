import {
  IsBoolean,
  IsDate,
  IsEmail,
  IsNumber,
  IsOptional,
  IsString,
} from "class-validator";

export class UserDto {
  @IsOptional()
  @IsEmail()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsNumber()
  nonce?: number;

  @IsOptional()
  @IsNumber()
  plantingNonce?: number;

  @IsOptional()
  @IsNumber()
  userRole?;

  @IsOptional()
  @IsDate()
  updatedAt?;

  @IsOptional()
  @IsDate()
  emailVerifiedAt?;

  @IsOptional()
  @IsString()
  mobile?;

  @IsOptional()
  @IsDate()
  mobileVerifiedAt?;

  @IsOptional()
  @IsDate()
  mobileCodeRequestedAt?;

  @IsOptional()
  @IsNumber()
  mobileCode?;

  @IsOptional()
  @IsNumber()
  mobileCodeRequestsCountForToday?;

  @IsOptional()
  @IsString()
  mobileCountry?;

  @IsOptional()
  @IsBoolean()
  isVerified?;

  @IsOptional()
  @IsString()
  idCard?;
}
