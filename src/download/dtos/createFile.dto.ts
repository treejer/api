import { IsDate, IsNumber, IsString } from "class-validator";

export class CreateFileDto {
  @IsString()
  userId;

  @IsNumber()
  module;

  @IsString()
  originalname;

  @IsString()
  encoding;

  @IsString()
  mimetype;

  @IsNumber()
  size;

  @IsString()
  filename;
}
