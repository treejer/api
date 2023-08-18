import { ApiResponseProperty } from "@nestjs/swagger";
import { IsBoolean } from "class-validator";

export class DeleteRequestResult {
  @ApiResponseProperty()
  @IsBoolean()
  acknowledged: boolean;
}
