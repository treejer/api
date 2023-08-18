import { IsDate, IsString } from "class-validator";

export class CreateUserMobileDto {
  @IsString()
  userId;

  @IsString()
  number;

  @IsDate()
  verifiedAt;

  @IsDate()
  createdAt;
}
