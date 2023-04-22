import { ApiResponseProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class SendVerificationCodeResultDto {
  @ApiResponseProperty()
  @IsString()
  message;

  @ApiResponseProperty()
  @IsString()
  mobileCountry;

  @ApiResponseProperty()
  @IsString()
  mobile;
}
