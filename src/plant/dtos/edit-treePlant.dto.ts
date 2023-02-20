import { IsNumber, IsOptional, IsString } from "class-validator";

export class EditTreePlantDto {
  @IsString()
  treeSpecs: string;

  @IsNumber()
  birthDate: number;

  @IsNumber()
  countryCode: number;

  @IsString()
  signature: string;

  @IsNumber()
  @IsOptional()
  nonce?: number;
}
