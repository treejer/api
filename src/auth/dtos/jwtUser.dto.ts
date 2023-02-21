import { IsString } from "class-validator";

export interface JwtUserDto extends Express.User {
  userId: string;
  walletAddress: string;
}
