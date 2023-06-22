import {
  IsBoolean,
  IsDate,
  IsDefined,
  IsEmail,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";
import { ForceUpdateDataDto } from "./force-update-data.dto";
import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";

export class UpdateSettingDto {
  @ApiProperty()
  @ValidateNested()
  @IsDefined()
  @Type(() => ForceUpdateDataDto)
  forceUpdate: ForceUpdateDataDto;
}
