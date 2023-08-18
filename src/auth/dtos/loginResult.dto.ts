import { ApiResponseProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class LoginResultDto {
  @ApiResponseProperty()
  @IsString()
  access_token: string;
}
