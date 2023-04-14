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
  SendVerificationCodeResultDto,
} from "./dtos";
import { AuthGuard } from "@nestjs/passport";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { User } from "src/user/decorators";
import {
  AuthErrorMessages,
  AuthServiceMessage,
  SwaggerErrors,
} from "src/common/constants";
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
        schema: {
          format: "text/plain",
          example: AuthErrorMessages.INVALID_WALLET,
        },
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: SwaggerErrors.INTERNAL_SERVER_ERROR_DESCRIPTION,
    content: {
      "text/plain": {
        schema: {
          format: "text/plain",
          example: SwaggerErrors.INTERNAL_SERVER_ERROR,
        },
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
          example: [
            SwaggerErrors.INVALID_INPUT,
            AuthErrorMessages.INVALID_WALLET,
          ],
        },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: "Response for invalid message signer.",
    content: {
      "text/plain": {
        schema: {
          format: "text/plain",
          example: AuthErrorMessages.INVALID_CREDENTIALS,
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: SwaggerErrors.NOT_FOUND_DESCRIPTION,
    content: {
      "text/plain": {
        schema: {
          format: "text/plain",
          example: AuthErrorMessages.USER_NOT_EXIST,
        },
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: SwaggerErrors.INTERNAL_SERVER_ERROR_DESCRIPTION,
    content: {
      "text/plain": {
        schema: {
          format: "text/plain",
          example: SwaggerErrors.INTERNAL_SERVER_ERROR,
        },
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
    content: {
      "text/plain": {
        example: AuthServiceMessage.MOBILE_VERIFIED,
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: SwaggerErrors.INVALID_INPUT_DESCRIPTION,
    content: {
      "text/plain": {
        schema: {
          format: "text/plain",
          example: SwaggerErrors.INVALID_INPUT,
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: SwaggerErrors.UNAUTHORIZED_DESCRIPTION,
    content: {
      "text/plain": {
        schema: { format: "text/plain", example: SwaggerErrors.UNAUTHORIZED },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: "Response for invalid mobile code.",
    content: {
      "text/plain": {
        schema: {
          format: "text/plain",
          example: AuthErrorMessages.INVLID_MOBILECODE,
        },
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
          example: AuthErrorMessages.MOBILE_ALREADY_VERIFIED,
        },
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: SwaggerErrors.INTERNAL_SERVER_ERROR_DESCRIPTION,
    content: {
      "text/plain": {
        schema: {
          format: "text/plain",
          example: SwaggerErrors.INTERNAL_SERVER_ERROR,
        },
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
    type: SendVerificationCodeResultDto,
  })
  @ApiResponse({
    status: 400,
    description: "Response for Invalid input or wait limit not reached",
    content: {
      "text/plain": {
        schema: {
          format: "text/plain",
          example: [
            SwaggerErrors.INVALID_INPUT,
            "Please wait until the time limit ends",
          ],
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: SwaggerErrors.UNAUTHORIZED_DESCRIPTION,
    content: {
      "text/plain": {
        schema: { format: "text/plain", example: SwaggerErrors.UNAUTHORIZED },
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
          example: AuthErrorMessages.MOBILE_IN_USE,
        },
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: SwaggerErrors.INTERNAL_SERVER_ERROR_DESCRIPTION,
    content: {
      "text/plain": {
        schema: {
          format: "text/plain",
          example: SwaggerErrors.INTERNAL_SERVER_ERROR,
        },
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
    content: {
      "text/plain": {
        example: AuthServiceMessage.RESEND_VERIFICATION_CODE_SUCCESSFUL,
      },
    },
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
    description: SwaggerErrors.UNAUTHORIZED_DESCRIPTION,
    content: {
      "text/plain": {
        schema: { format: "text/plain", example: SwaggerErrors.UNAUTHORIZED },
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
          example: AuthErrorMessages.MOBILE_ALREADY_VERIFIED,
        },
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: SwaggerErrors.INTERNAL_SERVER_ERROR_DESCRIPTION,
    content: {
      "text/plain": {
        schema: {
          format: "text/plain",
          example: SwaggerErrors.INTERNAL_SERVER_ERROR,
        },
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
