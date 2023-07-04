import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsString } from "class-validator";

export class CreateAssignedRequestDto {
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
  @IsNumber()
  birthDate: number;

  @ApiProperty()
  @IsNumber()
  countryCode: number;

  @ApiProperty()
  @IsString()
  signature: string;
}
