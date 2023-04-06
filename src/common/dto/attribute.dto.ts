import { IsString } from "class-validator";

export class Attribute {
  @IsString()
  trait_type: string;

  @IsString()
  value: string;
}
