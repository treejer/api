import { ApiResponseProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class CreateRequestResult {
  @ApiResponseProperty()
  @IsString()
  recordId: string;
}
