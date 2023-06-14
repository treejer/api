import { ApiResponseProperty } from "@nestjs/swagger";
import { IsArray, IsNumber } from "class-validator";
import { UserResultDto } from "src/user/dtos/user-result.dto";

export class GetPaginateUserResultDto {
  @ApiResponseProperty({ type: [UserResultDto] })
  @IsArray()
  data: UserResultDto[];

  @ApiResponseProperty()
  @IsNumber()
  count: number;
}
