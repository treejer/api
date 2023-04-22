import { ApiResponseProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class EtherDataResultDto {
  @ApiResponseProperty()
  @IsString()
  ethbtc;

  @ApiResponseProperty()
  @IsString()
  ethbtc_timestamp;

  @ApiResponseProperty()
  @IsString()
  ethusd;

  @ApiResponseProperty()
  @IsString()
  ethusd_timestamp;
}
