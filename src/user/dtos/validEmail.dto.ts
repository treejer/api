import { IsEmail } from "class-validator";

export class ValidEmailDto {
  @IsEmail()
  email;
}
