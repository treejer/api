import { IsEmail, IsNumber, IsOptional, IsString } from "class-validator";

export class CreateUserDto {
  @IsOptional()
  @IsEmail()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  walletAddress?: string;

  @IsNumber()
  nonce: number;

  @IsNumber()
  plantingNonce: number;
}
