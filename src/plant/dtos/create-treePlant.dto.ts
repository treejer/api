import { IsNumber, IsOptional, IsString } from "class-validator";

export class CreateTreePlantDto {
  @IsString()
  treeSpecs: string;

  @IsNumber()
  birthDate: number;

  @IsNumber()
  countryCode: number;

  @IsString()
  signature: string;
}
