import { IsNumber, IsOptional, IsString } from "class-validator";

export class CreateUpdateTreeDto {
  @IsNumber()
  treeId: number;

  @IsString()
  treeSpecs: string;

  @IsString()
  signature: string;

  @IsString()
  @IsOptional()
  signer?: string;

  @IsNumber()
  @IsOptional()
  nonce?: number;
}
