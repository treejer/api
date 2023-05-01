import { ApiResponseProperty } from "@nestjs/swagger";
import { IsBoolean, IsDate, IsString } from "class-validator";

export class GetUserMeResultDto {
  @ApiResponseProperty()
  @IsString()
  id: string;

  @ApiResponseProperty()
  @IsString()
  firstName: string;

  @ApiResponseProperty()
  @IsString()
  lastName: string;

  @ApiResponseProperty()
  @IsString()
  email: string;

  @ApiResponseProperty()
  @IsDate()
  emailVerifiedAt: Date;

  @ApiResponseProperty()
  @IsString()
  idCard: string;

  @ApiResponseProperty()
  @IsDate()
  createdAt: Date;

  @ApiResponseProperty()
  @IsDate()
  updatedAt: Date;

  @ApiResponseProperty()
  @IsString()
  mobile: string;

  @ApiResponseProperty()
  @IsString()
  mobileCountry: string;

  @ApiResponseProperty()
  @IsDate()
  mobileVerifiedAt: Date;

  @ApiResponseProperty()
  @IsBoolean()
  isVerified: boolean;
}
