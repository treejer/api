import { IsString } from "class-validator";

export class PatchMobileNumberDto {
  @IsString()
  mobileNumber;

  @IsString()
  country;
}
