import { ApiResponseProperty } from "@nestjs/swagger";
import { IsNumber, IsString } from "class-validator";

export class CreateResult {
  @ApiResponseProperty()
  @IsString()
  recordId: string;
}
