import { IsString } from "class-validator";

export interface JwtUserDto {
  userId: string;
  walletAddress: string;
}
