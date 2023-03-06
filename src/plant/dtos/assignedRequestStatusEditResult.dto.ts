import { ApiResponseProperty } from "@nestjs/swagger";
import { IsBoolean } from "class-validator";

export class AssignedRequestStatusEditResultDto {
  @ApiResponseProperty()
  @IsBoolean()
  acknowledged: boolean;
}
