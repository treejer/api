import { ApiResponseProperty } from "@nestjs/swagger";
import { IsDate, IsNumber, IsOptional, IsString } from "class-validator";

class InternalUpdateRequestDto {
  @ApiResponseProperty()
  @IsString()
  _id: string;

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

export class AdminUpdateRequestResultDto {
  @ApiResponseProperty()
  request: InternalUpdateRequestDto;
  @ApiResponseProperty()
  user: UserDto;
}
export class AdminUpdateRequestsWithPaginateResult {
  @ApiResponseProperty({ type: [AdminUpdateRequestResultDto] })
  data: AdminUpdateRequestResultDto[];

  @ApiResponseProperty()
  count: number;
}
