import { IsNumber, IsString } from "class-validator";

export class UpdateTreeDto {
  @IsString()
  signer: string;

  @IsNumber()
  nonce: number;

  @IsNumber()
  treeId: number;

  @IsString()
  treeSpecs: string;

  @IsString()
  signature: string;
}
