import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class MobileVerifyDto {
  @ApiProperty()
  @IsString()
  verifyMobileCode: string;
}
