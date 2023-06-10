import { ApiResponseProperty } from "@nestjs/swagger";
import { IsDate, IsNumber, IsString } from "class-validator";

export class UpdateRequestResultDto {
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
  status: number;

  @ApiResponseProperty()
  @IsDate()
  createdAt: Date;

  @ApiResponseProperty()
  @IsDate()
  updatedAt: Date;
}
