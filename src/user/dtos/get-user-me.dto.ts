import { ApiResponseProperty } from "@nestjs/swagger";
import {
  IsBoolean,
  IsDate,
  IsEmail,
  IsOptional,
  IsString,
} from "class-validator";

export class GetUserMeDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsOptional()
  @IsString()
  firstName?;

  @IsOptional()
  @IsString()
  lastName?;

  @IsOptional()
  @IsEmail()
  @IsString()
  email?;

  @IsOptional()
  @IsDate()
  emailVerifiedAt?;

  @IsOptional()
  @IsString()
  idCard?;

  @IsOptional()
  @IsDate()
  createdAt?;

  @IsOptional()
  @IsDate()
  updatedAt?;

  @IsOptional()
  @IsString()
  mobile?;

  @IsOptional()
  @IsString()
  mobileCountry?;

  @IsOptional()
  @IsDate()
  mobileVerifiedAt?;

  @IsOptional()
  @IsBoolean()
  isVerified?;
}
