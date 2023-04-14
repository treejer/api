import { ApiResponseProperty } from "@nestjs/swagger";
import { IsDate, IsNumber, IsString } from "class-validator";
import { EtherDataResultDto } from "./EtherDataResult.dto";

export class GetEthDataResultDto {
  @ApiResponseProperty()
  @IsString()
  _id: string;

  @ApiResponseProperty()
  @IsString()
  status: string;

  @ApiResponseProperty()
  @IsString()
  message: string;

  @ApiResponseProperty()
  result: EtherDataResultDto;

  @ApiResponseProperty()
  @IsDate()
  storedAt: Date;

  @ApiResponseProperty()
  @IsNumber()
  errorCount: number;
}
