import { ForceUpdateDataDto } from "./force-update-data.dto";
import { ApiProperty } from "@nestjs/swagger";

export class GetSettingResultDto {
  @ApiProperty()
  _id: string;

  @ApiProperty()
  forceUpdate: ForceUpdateDataDto;
}
