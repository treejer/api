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
@Controller()
export class AuthController {
  constructor(private authService: AuthService) {}

  // @Post("/signup")
  // signup(@Body() body: CreateUserDto, @Req() x) {
  //   // console.log("x", x.csrfToken());
  //   return this.authService.signup(body);
  // }
  // @Post("/signin")
  // signin(@Body() body: LoginDto, @Req() x) {
  //   console.log("x", x.headers);
  //   return this.authService.signin(body);
  // }
  // @UseGuards(AuthGuard("jwt"))
  // @Post("/logout")
  // logout(@Req() req: Request) {
  //   const user = req.user;
  //   console.log("uuuuuuu", user);
  //   return this.authService.logout(user["sub"]);
  // }

  // @UseGuards(AuthGuard("jwt-refresh"))
  // @Post("/refresh")
  // refreshToken(@Req() req: Request) {
  //   const user = req.user;
  //   return this.authService.refreshToken(user["sub"], user["refreshToken"]);
  // }

  // @Post("/verify")
  // sendMail(@Body() body) {
  //   const { username, code } = body;
  //   return this.authService.verify(username, code);
  // }

  @Get("auth/get-nonce/:wallet")
  getNonce(@Param("wallet") wallet: string) {
    return this.authService.getNonce(wallet);
  }

  @Post("auth/login/:wallet")
  loginWithWallet(
    @Param("wallet") wallet: string,
    @Body() dto: LoginWithWalletDto
  ) {
    const signature: string = dto.signature;
    return this.authService.loginWithWallet(wallet, signature);
  }

  @HasRoles(Role.ADMIN)
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Get("auth/me")
  getMe(@Req() req: Request) {
    // const user = req.user;

    console.log("haha", req.headers);

    // return this.authService.getMe(user["userId"]);
  }
}
