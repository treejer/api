import { ApiResponseProperty } from "@nestjs/swagger";
import { IsBoolean } from "class-validator";

export class EditResult {
  @ApiResponseProperty()
  @IsBoolean()
  acknowledged: boolean;
}
