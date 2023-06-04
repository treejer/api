import { ApiResponseProperty } from "@nestjs/swagger";
import { IsArray, IsNumber } from "class-validator";
import { PlantRequestResultDto } from "./plantRequestResult.dto";

export class PlantRequestsWithLimitResultDto {
  @ApiResponseProperty({ type: [PlantRequestResultDto] })
  @IsArray()
  data: PlantRequestResultDto[];

  @ApiResponseProperty()
  @IsNumber()
  count: number;
}
