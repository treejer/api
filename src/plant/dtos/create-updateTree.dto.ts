import { IsNumber, IsString } from "class-validator";

export class CreateUpdateTreeDto {
  @IsNumber()
  treeId: number;

  @IsString()
  treeSpecs: string;

  @IsString()
  signature: string;
}
