import { IsArray, IsOptional, IsString } from "class-validator";

export class UserMetadataResultDto {
  @IsString()
  issuer;

  @IsString()
  publicAddress;

  @IsString()
  @IsOptional()
  email?;

  @IsString()
  @IsOptional()
  oauthProvider?;

  @IsString()
  @IsOptional()
  phoneNumber?;

  @IsArray()
  @IsString()
  @IsOptional()
  wallets?;
}
