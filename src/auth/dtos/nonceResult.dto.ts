import { ApiResponseProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class NonceResultDto {
  @ApiResponseProperty()
  @IsString()
  message: string;

  @ApiResponseProperty()
  @IsString()
  userId: string;
}
