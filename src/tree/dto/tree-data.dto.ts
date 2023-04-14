import { ApiResponseProperty } from "@nestjs/swagger";
import { IsArray, IsDate, IsNumber, IsString } from "class-validator";
import { Attribute } from "src/common/dto";
import { AttributeDto } from "./attribute.dto";
import { AttributesTraitTypeDto } from "./attributes-trait-type.dto";
import { PlanterDto } from "./planter.dto";
import { TreeSpecsEntityDto } from "./tree-specs-entity.dto";

export class TreeDataResultDto {
  @ApiResponseProperty()
  @IsString()
  id: string;

  @ApiResponseProperty()
  planter: PlanterDto;

  @ApiResponseProperty()
  @IsString()
  funder: string | null;

  @ApiResponseProperty()
  @IsString()
  owner: string;

  @ApiResponseProperty()
  @IsString()
  countryCode: string;

  @ApiResponseProperty()
  @IsString()
  saleType: string;

  @ApiResponseProperty()
  @IsString()
  treeStatus: string;

  @ApiResponseProperty()
  @IsString()
  plantDate: string;

  @ApiResponseProperty()
  @IsString()
  birthDate: string;

  @ApiResponseProperty()
  attribute: AttributeDto;
  @ApiResponseProperty()
  treeSpecsEntity: TreeSpecsEntityDto;

  @ApiResponseProperty({ type: [AttributesTraitTypeDto] })
  attributes: AttributesTraitTypeDto;

  @ApiResponseProperty()
  @IsString()
  background_color: string;

  @ApiResponseProperty()
  @IsString()
  image: string;

  @ApiResponseProperty()
  @IsString()
  external_url: string;

  @ApiResponseProperty()
  @IsString()
  name: string;
}
