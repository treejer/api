import { IsString } from "class-validator";

export class UserVerificationByAdminDto {
  @IsString()
  userId;
}
