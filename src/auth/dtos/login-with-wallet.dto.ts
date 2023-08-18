import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class LoginWithWalletDto {
  @ApiProperty()
  @IsString()
  signature: string;
}
