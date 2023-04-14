import { ApiResponseProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class SendVerificationCodeResultDto {
  @ApiResponseProperty()
  @IsString()
  message: string;

  @ApiResponseProperty()
  @IsString()
  mobileCountry: string;

  @ApiResponseProperty()
  @IsString()
  mobile: string;
}
