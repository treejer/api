import { ApiResponseProperty } from "@nestjs/swagger";
import { IsBoolean } from "class-validator";

export class DeleteResult {
  @ApiResponseProperty()
  @IsBoolean()
  acknowledged: boolean;
}
