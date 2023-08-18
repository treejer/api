import { ApiResponseProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class GetTreeDataResultDto {
  @ApiResponseProperty()
  @IsString()
  id: string;

  @ApiResponseProperty()
  planter: string;

  @ApiResponseProperty()
  @IsString()
  treeStatus: string;

  @ApiResponseProperty()
  @IsString()
  plantDate: string;
}
