import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsString } from "class-validator";

export class PlantRequestDto {
  @ApiProperty()
  @IsString()
  treeSpecs: string;

  @ApiProperty()
  @IsNumber()
  birthDate: number;

  @ApiProperty()
  @IsNumber()
  countryCode: number;

  @ApiProperty()
  @IsString()
  signature: string;
}
