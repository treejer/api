import { ApiResponseProperty } from "@nestjs/swagger";
import { IsBoolean, IsNumber, IsString } from "class-validator";

export class AssignedRequestStatusEditResultDto {
  @ApiResponseProperty()
  @IsString()
  _id: string;

  @ApiResponseProperty()
  @IsNumber()
  status: number;
}
