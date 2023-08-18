import { IsNumber, IsString } from "class-validator";

export class UpdateRoleDto {
  @IsString()
  wallet;

  @IsNumber()
  role;
}
