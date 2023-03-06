import { ApiResponseProperty } from "@nestjs/swagger";
import { IsBoolean } from "class-validator";

export class UpdateRequestStatusEditResultDto {
  @ApiResponseProperty()
  @IsBoolean()
  acknowledged: boolean;
}
