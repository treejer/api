import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class UserVerificationByAdminDto {
  @ApiProperty()
  @IsString()
  userId: string;
}
