import { ApiResponseProperty } from "@nestjs/swagger";
import { IsDate, IsNumber, IsOptional, IsString } from "class-validator";
import { EtherDataResultDto } from "./EtherDataResult.dto";

export class GetEthDataResultDto {
  @ApiResponseProperty()
  @IsString()
  @IsOptional()
  _id?;

  @ApiResponseProperty()
  @IsString()
  status;

  @ApiResponseProperty()
  @IsString()
  message;

  @ApiResponseProperty()
  result: EtherDataResultDto;

  @ApiResponseProperty()
  @IsDate()
  storedAt;

  @ApiResponseProperty()
  @IsNumber()
  errorCount;
}
