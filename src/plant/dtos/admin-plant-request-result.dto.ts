import { ApiResponseProperty } from "@nestjs/swagger";
import { IsDate, IsNumber, IsOptional, IsString } from "class-validator";

class InternalPlantRequestDto {
  @ApiResponseProperty()
  @IsString()
  _id: string;

  @ApiResponseProperty()
  @IsNumber()
  birthDate: number;

  @ApiResponseProperty()
  @IsNumber()
  countryCode: number;
  @ApiResponseProperty()
  @IsString()
  signature: string;
  @ApiResponseProperty()
  @IsString()
  treeSpecs: string;

  @ApiResponseProperty()
  @IsString()
  treeSpecsJSON: string;

  @ApiResponseProperty()
  @IsString()
  signer: string;

  @ApiResponseProperty()
  @IsNumber()
  nonce: number;

  @ApiResponseProperty()
  @IsNumber()
  status: number;

  @ApiResponseProperty()
  @IsDate()
  updatedAt: Date;

  @ApiResponseProperty()
  @IsDate()
  createdAt: Date;
}
class UserDto {
  @ApiResponseProperty()
  @IsString()
  _id: string;
  @ApiResponseProperty()
  @IsString()
  @IsOptional()
  firstName?: string;
  @ApiResponseProperty()
  @IsString()
  @IsOptional()
  lastName?: string;
}

export class AdminPlantRequestResultDto {
  @ApiResponseProperty()
  request: InternalPlantRequestDto;
  @ApiResponseProperty()
  user: UserDto;
}

export class AdminPlantRequestsWithPaginateResult {
  @ApiResponseProperty({ type: [AdminPlantRequestResultDto] })
  data: AdminPlantRequestResultDto[];

  @ApiResponseProperty()
  count: number;
}
