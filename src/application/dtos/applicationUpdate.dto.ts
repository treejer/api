import { IsDate, IsEmail, IsNumber, IsString } from "class-validator";

export class ApplocationUpdateDto {
  @IsEmail()
  firstName;

  @IsString()
  lastName;

  @IsNumber()
  type;

  @IsString()
  organizationAddress;

  @IsString()
  referrer;

  @IsString()
  mimetype;

  @IsNumber()
  longitude;

  @IsNumber()
  latitude;
}
