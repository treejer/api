import { ApiResponseProperty } from "@nestjs/swagger";
import { IsDate, IsNumber, IsString } from "class-validator";
import { ApplicationResultDto } from "src/application/dtos";
import { FileResultDto } from "src/download/dtos/file-result.dto";
import { UserResultDto } from "src/user/dtos/user-result.dto";

export class GetUserResultDto {
  @ApiResponseProperty()
  user: UserResultDto;

  @ApiResponseProperty()
  application: ApplicationResultDto;

  @ApiResponseProperty()
  file: FileResultDto;
}
