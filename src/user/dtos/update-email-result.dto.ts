import { ApiResponseProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class UpdateEmailResultDto {
  @ApiResponseProperty()
  @IsString()
  email: string;
}
