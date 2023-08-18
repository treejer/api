import { ApiResponseProperty } from "@nestjs/swagger";
import { IsNumber, IsString } from "class-validator";
import { number, string } from "yargs";
type trait_value = number | string;
export class AttributesTraitTypeDto {
  @ApiResponseProperty()
  @IsString()
  trait_type: string;

  @ApiResponseProperty()
  @IsString()
  value: string;
}
