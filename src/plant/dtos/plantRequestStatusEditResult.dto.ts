import { ApiResponseProperty } from "@nestjs/swagger";
import { IsBoolean } from "class-validator";

export class PlantRequestStatusEditResultDto {
  @ApiResponseProperty()
  @IsBoolean()
  acknowledged: boolean;
}
