import { ApiResponseProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class UpdateUserInfoResultDto {
  @ApiResponseProperty()
  @IsString()
  firstName: string;

  @ApiResponseProperty()
  @IsString()
  lastName: string;
}
