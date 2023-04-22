import { ApiResponseProperty } from "@nestjs/swagger";
import { IsDate, IsNumber, IsOptional, IsString } from "class-validator";

export class FileResultDto {
  @ApiResponseProperty()
  @IsString()
  @IsOptional()
  _id?;

  @ApiResponseProperty()
  @IsString()
  originalname;

  @ApiResponseProperty()
  @IsString()
  filename;

  @ApiResponseProperty()
  @IsString()
  @IsOptional()
  encoding?;

  @ApiResponseProperty()
  @IsString()
  mimetype;

  @ApiResponseProperty()
  @IsNumber()
  size;

  @ApiResponseProperty()
  @IsString()
  userId;

  @ApiResponseProperty()
  @IsString()
  @IsOptional()
  targetId?;

  @ApiResponseProperty()
  @IsNumber()
  module;

  @ApiResponseProperty()
  @IsDate()
  createdAt;
}
