import { ApiResponseProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class EtherDataResultDto {
  @ApiResponseProperty()
  @IsString()
  ethbtc: string;

  @ApiResponseProperty()
  @IsString()
  ethbtc_timestamp: string;

  @ApiResponseProperty()
  @IsString()
  ethusd: string;

  @ApiResponseProperty()
  @IsString()
  ethusd_timestamp: string;
}
