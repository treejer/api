import { ApiResponseProperty } from "@nestjs/swagger";
import { IsBoolean, IsDate, IsNumber, IsString } from "class-validator";

export class UserResultDto {
  @ApiResponseProperty()
  @IsString()
  _id: string;

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
  @IsBoolean()
  isVerified: boolean;

  @ApiResponseProperty()
  @IsString()
  firstName: string;

  @ApiResponseProperty()
  @IsString()
  lastName: string;

  @ApiResponseProperty()
  @IsString()
  mobile: string;

  @ApiResponseProperty()
  @IsDate()
  mobileVerifiedAt: Date;

  @ApiResponseProperty()
  @IsDate()
  mobileCodeRequestedAt: Date;

  @ApiResponseProperty()
  @IsNumber()
  mobileCodeRequestsCountForToday: number;

  @ApiResponseProperty()
  @IsNumber()
  mobileCode: number;

  @ApiResponseProperty()
  @IsString()
  mobileCountry: string;

  @ApiResponseProperty()
  @IsString()
  email: string;

  @ApiResponseProperty()
  @IsDate()
  emailVerifiedAt: Date;

  @ApiResponseProperty()
  @IsString()
  emailToken: string;

  @ApiResponseProperty()
  @IsDate()
  emailTokenRequestedAt: Date;

  @ApiResponseProperty()
  @IsString()
  idCard: string;
}
