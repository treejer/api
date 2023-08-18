import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsDefined, IsString } from "class-validator";

export class ForceUpdateDataDto {
  @ApiProperty()
  @IsDefined()
  @IsString()
  version: string;

  @ApiProperty()
  @IsBoolean()
  @IsDefined()
  force: boolean;
}
