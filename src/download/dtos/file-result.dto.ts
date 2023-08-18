import { ApiResponseProperty } from "@nestjs/swagger";
import { IsDate, IsNumber, IsOptional, IsString } from "class-validator";

export class FileResultDto {
  @ApiResponseProperty()
  @IsString()
  @IsOptional()
  _id?: string;

  @ApiResponseProperty()
  @IsString()
  originalname: string;

  @ApiResponseProperty()
  @IsString()
  filename: string;

  @ApiResponseProperty()
  @IsString()
  @IsOptional()
  encoding?: string;

  @ApiResponseProperty()
  @IsString()
  mimetype: string;

  @ApiResponseProperty()
  @IsNumber()
  size: number;

  @ApiResponseProperty()
  @IsString()
  userId: string;

  @ApiResponseProperty()
  @IsString()
  @IsOptional()
  targetId?: string;

  @ApiResponseProperty()
  @IsNumber()
  module: number;

  @ApiResponseProperty()
  @IsDate()
  createdAt: Date;
}
