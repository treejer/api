import { ApiResponseProperty } from "@nestjs/swagger";
import { IsDate, IsNumber, IsOptional, IsString } from "class-validator";

export class UserResultDto {
  @ApiResponseProperty()
  @IsString()
  @IsOptional()
  _id?: string;

  @ApiResponseProperty()
  @IsString()
  walletAddress: string;

  @ApiResponseProperty()
  @IsNumber()
  nonce: number;

  @ApiResponseProperty()
  @IsNumber()
  plantingNonce: number;

  @ApiResponseProperty()
  @IsDate()
  createdAt: Date;

  @ApiResponseProperty()
  @IsNumber()
  userRole: number;

  @ApiResponseProperty()
  @IsDate()
  updatedAt: Date;

  @ApiResponseProperty()
  @IsNumber()
  userStatus: number;

  @ApiResponseProperty()
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiResponseProperty()
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiResponseProperty()
  @IsString()
  @IsOptional()
  mobile?: string;

  @ApiResponseProperty()
  @IsDate()
  @IsOptional()
  mobileVerifiedAt?: Date;

  @ApiResponseProperty()
  @IsDate()
  @IsOptional()
  mobileCodeRequestedAt?: Date;

  @ApiResponseProperty()
  @IsNumber()
  @IsOptional()
  mobileCodeRequestsCountForToday?: number;

  @ApiResponseProperty()
  @IsNumber()
  @IsOptional()
  mobileCode?: number;

  @ApiResponseProperty()
  @IsString()
  @IsOptional()
  mobileCountry?: string;

  @ApiResponseProperty()
  @IsString()
  @IsOptional()
  email?: string;

  @ApiResponseProperty()
  @IsDate()
  @IsOptional()
  emailVerifiedAt?: Date;

  @ApiResponseProperty()
  @IsString()
  @IsOptional()
  emailToken?: string;

  @ApiResponseProperty()
  @IsDate()
  @IsOptional()
  emailTokenRequestedAt?: Date;

  @ApiResponseProperty()
  @IsString()
  @IsOptional()
  idCard?: string;
}
