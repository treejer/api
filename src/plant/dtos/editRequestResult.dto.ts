import { ApiResponseProperty } from "@nestjs/swagger";
import { IsBoolean } from "class-validator";

export class EditRequestResultDto {
  @ApiResponseProperty()
  @IsBoolean()
  acknowledged: boolean;
}
