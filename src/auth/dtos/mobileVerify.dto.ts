import { IsString } from "class-validator";

export class MobileVerifyDto {
  @IsString()
  verifyMobileCode;
}
