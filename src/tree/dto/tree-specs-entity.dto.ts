import { ApiResponseProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class TreeSpecsEntityDto {
  @ApiResponseProperty()
  @IsString()
  id: string;

  @ApiResponseProperty()
  @IsString()
  name: string;

  @ApiResponseProperty()
  @IsString()
  description: string;

  @ApiResponseProperty()
  @IsString()
  externalUrl: string;

  @ApiResponseProperty()
  @IsString()
  imageFs: string;

  @ApiResponseProperty()
  @IsString()
  imageHash: string;

  @ApiResponseProperty()
  @IsString()
  symbolFs: string;

  @ApiResponseProperty()
  @IsString()
  symbolHash: string;

  @ApiResponseProperty()
  @IsString()
  animationUrl: string;

  @ApiResponseProperty()
  @IsString()
  diameter: string;

  @ApiResponseProperty()
  @IsString()
  latitude: string;

  @ApiResponseProperty()
  @IsString()
  longitude: string;

  @ApiResponseProperty()
  @IsString()
  attributes: string;
}
