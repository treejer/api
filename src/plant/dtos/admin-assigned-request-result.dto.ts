import { ApiResponseProperty } from "@nestjs/swagger";
import { IsDate, IsNumber, IsOptional, IsString } from "class-validator";

class InternalAssignedRequestDto {
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
  @IsNumber()
  treeId: number;

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

export class AdminAssignedRequestResultDto {
  @ApiResponseProperty()
  request: InternalAssignedRequestDto;
  @ApiResponseProperty()
  user: UserDto;
}

export class AdminAssignedRequestsWithPaginateResult {
  @ApiResponseProperty({ type: [AdminAssignedRequestResultDto] })
  data: AdminAssignedRequestResultDto[];

  @ApiResponseProperty()
  count: number;
}
