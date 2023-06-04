import { ApiResponseProperty } from "@nestjs/swagger";
import { IsArray, IsNumber } from "class-validator";
import { AssignedRequestResultDto } from "./assignedRequestResult.dto";

export class AssignedRequestWithLimitResultDto {
  @ApiResponseProperty({ type: [AssignedRequestResultDto] })
  @IsArray()
  data: AssignedRequestResultDto[];

  @ApiResponseProperty()
  @IsNumber()
  count: number;
}
