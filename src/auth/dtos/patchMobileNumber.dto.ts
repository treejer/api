import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class PatchMobileNumberDto {
  @ApiProperty()
  @IsString()
  mobileNumber: string;

  @ApiProperty()
  @IsString()
  country: string;
}
