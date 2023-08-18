import { IsOptional, IsString } from "class-validator";

export class CreateMagicAuthDto {
  @IsString()
  userId;

  @IsString()
  @IsOptional()
  issuer?;

  @IsString()
  walletAddress;

  @IsString()
  @IsOptional()
  email?;

  @IsString()
  @IsOptional()
  oauthProvider?;

  @IsString()
  @IsOptional()
  mobile?;

  @IsString()
  createdAt;
}
