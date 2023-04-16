import { IsEmail, IsString } from "class-validator";

export class ValidEmailDto {
  @IsEmail()
  email;
}

export class updateEmailResultDto extends ValidEmailDto {
  @IsString()
  message;
}
