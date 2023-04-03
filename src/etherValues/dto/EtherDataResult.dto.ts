import { IsString } from "class-validator";

export class EtherDataResultDto {
  @IsString()
  ethbtc: string;

  @IsString()
  ethbtc_timestamp: string;

  @IsString()
  ethusd: string;

  @IsString()
  ethusd_timestamp: string;
}
