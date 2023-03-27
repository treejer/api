import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  SetMetadata,
  UseGuards,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { CreateUserDto } from "./../user/dtos";
import {
  JwtUserDto,
  LoginDto,
  LoginResultDto,
  LoginWithWalletDto,
  MobileVerifyDto,
  NonceResultDto,
  PatchMobileNumberDto,
} from "./dtos";
import { AuthGuard } from "@nestjs/passport";
import { Request } from "express";
import { RolesGuard } from "./strategies";
import { HasRoles } from "./decorators";
import { Role } from "./../common/constants";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { User } from "src/user/decorators";
@ApiTags("auth")
@Controller()
export class AuthController {
  constructor(private authService: AuthService) {}

  @ApiOperation({ summary: "get sign message" })
  @ApiResponse({
    status: 200,
    description: "Response including sign message",
    type: NonceResultDto,
  })
  @ApiResponse({
    status: 400,
    description: "Response for invalid wallet address",
    content: {
      "text/plain": {
        schema: { format: "text/plain", example: "Invalid Wallet" },
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: "Response for Internal server errror.",
    content: {
      "text/plain": {
        schema: { format: "text/plain", example: "Internal server error" },
      },
    },
  })
  @Get("nonce/:wallet")
  getNonce(@Param("wallet") wallet: string): Promise<NonceResultDto> {
    return this.authService.getNonce(wallet);
  }

  @ApiOperation({ summary: "login with wallet" })
  @ApiResponse({
    status: 200,
    description: "Response including access_token",
    type: LoginResultDto,
  })
  @ApiResponse({
    status: 400,
    description: "Response for invalid input or wallet address",
    content: {
      "text/plain": {
        schema: {
          format: "text/plain",
          examples: ["Invalid Input", "Invalid Wallet"],
        },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: "Response for invalid message signer.",
    content: {
      "text/plain": {
        schema: { format: "text/plain", example: "invalid credentials" },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: "Response for not found user.",
    content: {
      "text/plain": {
        schema: { format: "text/plain", example: "User Not Found" },
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: "Response for Internal server errror.",
    content: {
      "text/plain": {
        schema: { format: "text/plain", example: "Internal server error" },
      },
    },
  })
  @Post("login/:wallet")
  loginWithWallet(
    @Param("wallet") wallet: string,
    @Body() dto: LoginWithWalletDto
  ): Promise<LoginResultDto> {
    const signature: string = dto.signature;
    return this.authService.loginWithWallet(wallet, signature);
  }

  @UseGuards(AuthGuard("jwt"))
  @Get("user/me")
  async getUser(@User() user: JwtUserDto) {
    return await this.authService.getUserById(user.userId);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard("jwt"))
  @Post("mobile/verify")
  async verifyMobileCode(
    @User() user: JwtUserDto,
    @Body() dto: MobileVerifyDto
  ) {
    const { verifyMobileCode } = dto;

    return await this.authService.verifyMobileCode(
      user.userId,
      verifyMobileCode
    );
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard("jwt"))
  @Patch("mobile/send")
  async patchMobileNumber(
    @User() user: JwtUserDto,
    @Body() dto: PatchMobileNumberDto
  ) {
    const { mobileNumber, country } = dto;
    console.log("mooo", mobileNumber);
    console.log("country", country);

    return await this.authService.patchMobileNumber(
      user.userId,
      mobileNumber,
      country
    );
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard("jwt"))
  @Post("mobile/resend")
  async resendMobileCode(@User() user: JwtUserDto) {
    return await this.authService.resendMobileCode(user.userId);
  }
}
