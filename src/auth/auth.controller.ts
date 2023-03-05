import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  SetMetadata,
  UseGuards,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { CreateUserDto } from "./../user/dtos";
import { LoginDto, LoginWithWalletDto } from "./dtos";
import { AuthGuard } from "@nestjs/passport";
import { Request } from "express";
import { RolesGuard } from "./strategies";
import { HasRoles } from "./decorators";
import { Role } from "./../common/constants";
import { ApiTags } from "@nestjs/swagger";
@ApiTags("auth")
@Controller()
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get("nonce/:wallet")
  getNonce(@Param("wallet") wallet: string) {
    return this.authService.getNonce(wallet);
  }

  @Post("login/:wallet")
  loginWithWallet(
    @Param("wallet") wallet: string,
    @Body() dto: LoginWithWalletDto
  ) {
    const signature: string = dto.signature;
    return this.authService.loginWithWallet(wallet, signature);
  }
}
