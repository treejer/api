import { ApiResponseProperty } from "@nestjs/swagger";
import { IsArray, IsNumber } from "class-validator";
import { UpdateRequestResultDto } from "./updateRequestResult.dto";

export class UpdateRequestWithLimitResultDto {
  @ApiResponseProperty({ type: [UpdateRequestResultDto] })
  @IsArray()
  data: UpdateRequestResultDto;

  @ApiResponseProperty()
  @IsNumber()
  count: number;
}
