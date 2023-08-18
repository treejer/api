import { ApiResponseProperty } from "@nestjs/swagger";
import { IsNumber, IsString } from "class-validator";

export class UpdateRequestStatusEditResultDto {
  @ApiResponseProperty()
  @IsString()
  _id: string;

  @ApiResponseProperty()
  @IsNumber()
  status: number;
}
