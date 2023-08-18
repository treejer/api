import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsString } from "class-validator";

export class CreateUpdateRequestDto {
  @ApiProperty()
  @IsNumber()
  treeId: number;

  @ApiProperty()
  @IsString()
  treeSpecs: string;

  @ApiProperty()
  @IsString()
  treeSpecsJSON: string;

  @ApiProperty()
  @IsString()
  signature: string;
}
