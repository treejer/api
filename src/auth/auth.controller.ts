import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { AuthService } from "./auth.service";

import {
  JwtUserDto,
  LoginResultDto,
  LoginWithWalletDto,
  MobileVerifyDto,
  NonceResultDto,
  PatchMobileNumberDto,
} from "./dtos";
import { AuthGuard } from "@nestjs/passport";
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

  //------------------------------------------ ************************ ------------------------------------------//
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
          example: ["Invalid Input", "Invalid Wallet"],
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

  //------------------------------------------ ************************ ------------------------------------------//
  @ApiBearerAuth()
  @ApiOperation({ summary: "verify mobile number" })
  @ApiResponse({
    status: 200,
    description: "mobile number successfully verified.",
  })
  @ApiResponse({
    status: 400,
    description: "Response for Invalid input",
    content: {
      "text/plain": {
        schema: {
          format: "text/plain",
          example: "Invalid Input",
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: "Response for unauthorized users",
    content: {
      "text/plain": {
        schema: { format: "text/plain", example: "Unauthorized" },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: "Response for invalid mobile code.",
    content: {
      "text/plain": {
        schema: { format: "text/plain", example: "invalid code" },
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: "Response for verified mobile numbers.",
    content: {
      "text/plain": {
        schema: {
          format: "text/plain",
          example: "Mobile number already verified.",
        },
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

  //------------------------------------------ ************************ ------------------------------------------//

  @ApiBearerAuth()
  @ApiOperation({ summary: "send verification code" })
  @ApiResponse({
    status: 200,
    description: "verification code successfully sent.",
  })
  @ApiResponse({
    status: 400,
    description: "Response for Invalid input or wait limit not reached",
    content: {
      "text/plain": {
        schema: {
          format: "text/plain",
          example: ["Invalid Input", "Please wait until the time limit ends"],
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: "Response for unauthorized users",
    content: {
      "text/plain": {
        schema: { format: "text/plain", example: "Unauthorized" },
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: "Response for in used mobile numbers.",
    content: {
      "text/plain": {
        schema: {
          format: "text/plain",
          example: "This mobile number has been already registered.",
        },
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
  @ApiBearerAuth()
  @UseGuards(AuthGuard("jwt"))
  @Patch("mobile/send")
  async patchMobileNumber(
    @User() user: JwtUserDto,
    @Body() dto: PatchMobileNumberDto
  ) {
    const { mobileNumber, country } = dto;

    return await this.authService.patchMobileNumber(
      user.userId,
      mobileNumber,
      country
    );
  }

  //------------------------------------------ ************************ ------------------------------------------//
  @ApiBearerAuth()
  @ApiOperation({ summary: "resend verification code" })
  @ApiResponse({
    status: 200,
    description: "verification code successfully resent.",
  })
  @ApiResponse({
    status: 400,
    description: "Response for wait limit not reached",
    content: {
      "text/plain": {
        schema: {
          format: "text/plain",
          example: "Please wait until the time limit ends",
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: "Response for unauthorized users",
    content: {
      "text/plain": {
        schema: { format: "text/plain", example: "Unauthorized" },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: "Response for verified mobile numbers.",
    content: {
      "text/plain": {
        schema: {
          format: "text/plain",
          example: "Mobile number already verified",
        },
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
  @ApiBearerAuth()
  @UseGuards(AuthGuard("jwt"))
  @Post("mobile/resend")
  async resendMobileCode(@User() user: JwtUserDto) {
    return await this.authService.resendMobileCode(user.userId);
  }
}
