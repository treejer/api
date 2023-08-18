import { ApiResponseProperty } from "@nestjs/swagger";
import { IsDate, IsNumber, IsOptional, IsString } from "class-validator";

export class ApplicationResultDto {
  @ApiResponseProperty()
  @IsString()
  @IsOptional()
  _id?: string;

  @ApiResponseProperty()
  @IsString()
  userId: string;

  @ApiResponseProperty()
  @IsNumber()
  type: number;

  @ApiResponseProperty()
  @IsDate()
  @IsOptional()
  deletedAt: Date;

  @ApiResponseProperty()
  @IsDate()
  createdAt: Date;

  @ApiResponseProperty()
  @IsDate()
  updatedAt: Date;

  @ApiResponseProperty()
  @IsString()
  organizationAddress: string;

  @ApiResponseProperty()
  @IsString()
  referrer: string;

  @ApiResponseProperty()
  @IsNumber()
  longitude: number;

  @ApiResponseProperty()
  @IsNumber()
  latitude: number;
}
