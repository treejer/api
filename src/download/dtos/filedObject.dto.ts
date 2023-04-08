import { IsDate, IsNumber, IsString } from "class-validator";
import { Type } from "class-transformer";

export class FieldObjectDto {
  @IsString()
  firstName;

  @IsString()
  lastName;

  @Type(() => Number)
  @IsNumber()
  type;

  @IsString()
  organizationAddress;

  @IsString()
  referrer;

  @Type(() => Number)
  @IsNumber()
  longitude;

  @Type(() => Number)
  @IsNumber()
  latitude;
}
