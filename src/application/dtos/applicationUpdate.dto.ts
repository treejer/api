import {
  IsDate,
  IsEmail,
  IsNumber,
  IsOptional,
  IsString,
} from "class-validator";

export class ApplocationUpdateDto {
  @IsEmail()
  @IsOptional()
  firstName?;

  @IsString()
  @IsOptional()
  lastName?;

  @IsNumber()
  @IsOptional()
  type?;

  @IsDate()
  @IsOptional()
  deletedAt?;

  @IsString()
  @IsOptional()
  organizationAddress?;

  @IsString()
  @IsOptional()
  referrer?;

  @IsString()
  @IsOptional()
  mimetype?;

  @IsNumber()
  @IsOptional()
  longitude?;

  @IsNumber()
  @IsOptional()
  latitude?;
}
