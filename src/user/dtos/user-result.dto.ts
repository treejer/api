import { ApiResponseProperty } from "@nestjs/swagger";
import {
  IsBoolean,
  IsDate,
  IsNumber,
  IsOptional,
  IsString,
} from "class-validator";

export class UserResultDto {
  @ApiResponseProperty()
  @IsString()
  @IsOptional()
  _id?;

  @ApiResponseProperty()
  @IsString()
  walletAddress;

  @ApiResponseProperty()
  @IsNumber()
  nonce;

  @ApiResponseProperty()
  @IsNumber()
  plantingNonce;

  @ApiResponseProperty()
  @IsDate()
  createdAt;

  @ApiResponseProperty()
  @IsNumber()
  userRole;

  @ApiResponseProperty()
  @IsDate()
  updatedAt;

  @ApiResponseProperty()
  @IsNumber()
  userStatus;

  @ApiResponseProperty()
  @IsString()
  @IsOptional()
  firstName?;

  @ApiResponseProperty()
  @IsString()
  @IsOptional()
  lastName?;

  @ApiResponseProperty()
  @IsString()
  @IsOptional()
  mobile?;

  @ApiResponseProperty()
  @IsDate()
  @IsOptional()
  mobileVerifiedAt?;

  @ApiResponseProperty()
  @IsDate()
  @IsOptional()
  mobileCodeRequestedAt?;

  @ApiResponseProperty()
  @IsNumber()
  @IsOptional()
  mobileCodeRequestsCountForToday?;

  @ApiResponseProperty()
  @IsNumber()
  @IsOptional()
  mobileCode?;

  @ApiResponseProperty()
  @IsString()
  @IsOptional()
  mobileCountry?;

  @ApiResponseProperty()
  @IsString()
  @IsOptional()
  email?;

  @ApiResponseProperty()
  @IsDate()
  @IsOptional()
  emailVerifiedAt?;

  @ApiResponseProperty()
  @IsString()
  @IsOptional()
  emailToken?;

  @ApiResponseProperty()
  @IsDate()
  @IsOptional()
  emailTokenRequestedAt?;

  @ApiResponseProperty()
  @IsString()
  @IsOptional()
  idCard?;
}
