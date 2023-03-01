import { IsNumber, IsString } from "class-validator";

export class EditTreeAssignPlantDto {
  @IsString()
  treeSpecs: string;

  @IsNumber()
  birthDate: number;

  @IsNumber()
  countryCode: number;

  @IsString()
  signature: string;
}
