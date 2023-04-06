import { IsString } from "class-validator";

export class TreeAttributesDto {
  @IsString()
  shape: string;
  @IsString()
  trunkColor: string;

  @IsString()
  crownColor: string;

  @IsString()
  effect: string;
  @IsString()
  coefficient: string;

  @IsString()
  generationType: string;
}
