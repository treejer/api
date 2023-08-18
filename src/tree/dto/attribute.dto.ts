import { ApiResponseProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class AttributeDto {
  @ApiResponseProperty()
  @IsString()
  attribute1: string;

  @ApiResponseProperty()
  @IsString()
  attribute2: string;

  @ApiResponseProperty()
  @IsString()
  attribute3: string;

  @ApiResponseProperty()
  @IsString()
  attribute4: string;

  @ApiResponseProperty()
  @IsString()
  attribute5: string;

  @ApiResponseProperty()
  @IsString()
  attribute6: string;

  @ApiResponseProperty()
  @IsString()
  attribute7: string;

  @ApiResponseProperty()
  @IsString()
  attribute8: string;

  @ApiResponseProperty()
  @IsString()
  generationType: string;
}
