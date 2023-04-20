import { IsString } from "class-validator";

export class UpdateUserInfoRequest {
  @IsString()
  firstName;

  @IsString()
  lastName;
}
