import { ApiResponseProperty } from "@nestjs/swagger";
import { IsDate, IsNumber, IsString } from "class-validator";

export class FileResultDto {
  @ApiResponseProperty()
  @IsString()
  _id: string;

  @ApiResponseProperty()
  @IsString()
  originalname: string;

  @ApiResponseProperty()
  @IsString()
  filename: string;

  @ApiResponseProperty()
  @IsString()
  encoding: string;

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
  targetId: string;

  @ApiResponseProperty()
  @IsNumber()
  module: number;

  @ApiResponseProperty()
  @IsDate()
  createdAt: Date;
}
