import { ApiResponseProperty } from "@nestjs/swagger";
import { IsDate, IsNumber, IsOptional, IsString } from "class-validator";

export class ApplicationResultDto {
  @ApiResponseProperty()
  @IsString()
  @IsOptional()
  _id?;

  @ApiResponseProperty()
  @IsString()
  userId;

  @ApiResponseProperty()
  @IsNumber()
  type;

  @ApiResponseProperty()
  @IsNumber()
  status;
  @ApiResponseProperty()
  @IsDate()
  createdAt;

  @ApiResponseProperty()
  @IsDate()
  updatedAt;

  @ApiResponseProperty()
  @IsString()
  organizationAddress;

  @ApiResponseProperty()
  @IsString()
  referrer;

  @ApiResponseProperty()
  @IsNumber()
  longitude;

  @ApiResponseProperty()
  @IsNumber()
  latitude;
}
