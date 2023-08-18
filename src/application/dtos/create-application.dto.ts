import { ApiResponseProperty } from "@nestjs/swagger";
import { FileResultDto } from "src/download/dtos/file-result.dto";
import { ApplicationResultDto } from "./application-result.dto";

export class CreateApplicationResultDto {
  @ApiResponseProperty()
  application: ApplicationResultDto;

  @ApiResponseProperty()
  file: FileResultDto;
}
