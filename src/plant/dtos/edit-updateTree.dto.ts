import { IsString } from "class-validator";

export class EditUpdateTreeDto {
  @IsString()
  treeSpecs: string;

  @IsString()
  signature: string;
}
