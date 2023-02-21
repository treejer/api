import { IsNumber, IsString } from "class-validator";

export class CreateAssignedTreePlantDto {
  @IsNumber()
  treeId: number;

  @IsString()
  treeSpecs: string;

  @IsNumber()
  birthDate: number;

  @IsNumber()
  countryCode: number;

  @IsString()
  signature: string;
}
