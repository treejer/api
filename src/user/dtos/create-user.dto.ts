import {
  IsBoolean,
  IsDate,
  IsEmail,
  IsNumber,
  IsOptional,
  IsString,
} from "class-validator";

export class CreateUserDto {
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
  @IsDate()
  mobileVerifiedAt?;

  @IsOptional()
  @IsDate()
  createdAt?;

  @IsOptional()
  @IsDate()
  updatedAt?;

  @IsOptional()
  @IsNumber()
  mobileCodeRequestsCountForToday?;

  @IsOptional()
  @IsNumber()
  userStatus?;

  @IsOptional()
  @IsString()
  firstName?;

  @IsOptional()
  @IsString()
  lastName?;

  @IsOptional()
  @IsString()
  walletAddress?;

  @IsNumber()
  nonce: number;

  @IsNumber()
  plantingNonce;
}
