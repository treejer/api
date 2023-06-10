import { ApiResponseProperty } from "@nestjs/swagger";
import { IsDate, IsNumber, IsString } from "class-validator";

export class AssignedRequestResultDto {
  @ApiResponseProperty()
  @IsString()
  _id: string;

  @ApiResponseProperty()
  @IsString()
  signer: string;

  @ApiResponseProperty()
  @IsNumber()
  nonce: number;

  @ApiResponseProperty()
  @IsNumber()
  treeId: number;

  @ApiResponseProperty()
  @IsString()
  treeSpecs: string;

  @ApiResponseProperty()
  @IsNumber()
  birthDate: number;

  @ApiResponseProperty()
  @IsNumber()
  countryCode: number;

  @ApiResponseProperty()
  @IsNumber()
  status: number;

  @ApiResponseProperty()
  @IsDate()
  createdAt: Date;

  @ApiResponseProperty()
  @IsDate()
  updatedAt: Date;
}
