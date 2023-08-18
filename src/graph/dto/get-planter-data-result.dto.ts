import { ApiResponseProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class GetPlanterDataResultDto {
  @ApiResponseProperty()
  @IsString()
  id: string;

  @ApiResponseProperty()
  status: string;

  @ApiResponseProperty()
  @IsString()
  planterType: string;

  @ApiResponseProperty()
  @IsString()
  plantedCount: string;

  @ApiResponseProperty()
  @IsString()
  supplyCap: string;

  @ApiResponseProperty()
  @IsString()
  memberOf: string;
}
