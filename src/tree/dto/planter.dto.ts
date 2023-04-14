import { ApiResponseProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class PlanterDto {
  @ApiResponseProperty()
  @IsString()
  id: string;
}
