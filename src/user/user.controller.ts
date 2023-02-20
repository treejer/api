import { Controller, Get, Param, Query, Req } from "@nestjs/common";
import { Request } from "express";
import { UserService } from "./user.service";

@Controller("users")
export class UserController {
  constructor(private userService: UserService) {}

  @Get()
  getUserList() {
    return this.userService.getUserList();
  }

  @Get("/sort")
  getSortedUsersByNonce() {
    return this.userService.getSortedUserByNonce();
  }

  @Get("/profile")
  getUserByWalletAddressWithQueryParam(@Query("wallet") wallet: string) {
    return this.userService.findUserByWallet(wallet);
  }

  @Get("/profile/:wallet")
  getUserByWalletAddressWithRoute(@Param("wallet") wallet: string) {
    return this.userService.findUserByWallet(wallet);
  }
}
