import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class EditUpdateRequestDto {
  @ApiProperty()
  @IsString()
  treeSpecs: string;

  @ApiProperty()
  @IsString()
  signature: string;
}
