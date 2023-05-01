import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";

import { UserService } from "./user.service";
import { AuthGuard } from "@nestjs/passport";

import {
  AuthErrorMessages,
  AuthServiceMessage,
  EmailMessage,
  SwaggerErrors,
  UserErrorMessage,
  UserServiceMessage,
} from "src/common/constants";
import { User } from "./decorators";
import { JwtUserDto } from "src/auth/dtos";
import {
  GetUserMeResultDto,
  UpdateEmailResultDto,
  UpdateUserInfoRequest,
  UpdateUserInfoResultDto,
  ValidEmailDto,
} from "./dtos";

@ApiTags("user")
@Controller("users")
export class UserController {
  constructor(private userService: UserService) {}

  @ApiBearerAuth()
  @ApiOperation({ summary: "update email." })
  @ApiResponse({
    status: 200,
    description: "email successfully updated.",
    type: UpdateEmailResultDto,
  })
  @ApiResponse({
    status: 400,
    description: "invalid input or wait time limit",
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
    description: AuthErrorMessages.EMAIL_IN_USE,
    content: {
      "text/plain": {
        schema: {
          format: "text/plain",
          example: AuthErrorMessages.EMAIL_IN_USE,
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
  @Patch("/email")
  updateEmail(@Body() dto: ValidEmailDto, @User() user: JwtUserDto) {
    return this.userService.updateEmail(dto, user);
  }

  //------------------------------------------ ************************ ------------------------------------------//
  @ApiOperation({ summary: "verify email." })
  @ApiResponse({
    status: 200,
    description: "email successfully verified.",
    content: {
      "text/plain": {
        example: UserServiceMessage.EMAIL_VERIFIED,
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: "invalid input or token expired",
    content: {
      "text/plain": {
        schema: {
          format: "text/plain",
          example: [
            SwaggerErrors.INVALID_INPUT,
            `15 ${UserErrorMessage.RESEND_EMAIL_MESSAGE}`,
          ],
        },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: "invalid token",
    content: {
      "text/plain": {
        schema: {
          format: "text/plain",
          example: [EmailMessage.INVALID_TOKEN],
        },
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: AuthErrorMessages.YOU_HAVE_VERIFED_EMAIL,
    content: {
      "text/plain": {
        schema: {
          format: "text/plain",
          example: AuthErrorMessages.YOU_HAVE_VERIFED_EMAIL,
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
  @Get("/email/verify")
  verifyEmail(@Query("token") token: string) {
    return this.userService.verifyEmail(token);
  }

  //------------------------------------------ ************************ ------------------------------------------//

  @ApiOperation({ summary: "resend email." })
  @ApiResponse({
    status: 200,
    description: "email successfully resend.",
    content: {
      "text/plain": {
        example: AuthServiceMessage.RESEND_VERIFICATION_EMAIL_TOKEN_SUCCESSFUL,
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: "email not found or wait limit",
    content: {
      "text/plain": {
        schema: {
          format: "text/plain",
          example: [
            AuthErrorMessages.EMAIL_ADDRESS_NOT_FOUND,
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
    description: AuthErrorMessages.YOU_HAVE_VERIFED_EMAIL,
    content: {
      "text/plain": {
        schema: {
          format: "text/plain",
          example: AuthErrorMessages.YOU_HAVE_VERIFED_EMAIL,
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
  @Get("/email/resend")
  resendEmailToken(@User() user: JwtUserDto) {
    return this.userService.resendEmailToken(user);
  }

  //------------------------------------------ ************************ ------------------------------------------//
  @ApiBearerAuth()
  @ApiOperation({ summary: "update user info." })
  @ApiResponse({
    status: 200,
    description: "user info successfully updated.",
    type: UpdateUserInfoResultDto,
  })
  @ApiResponse({
    status: 400,
    description: SwaggerErrors.INVALID_INPUT_DESCRIPTION,
    content: {
      "text/plain": {
        schema: { format: "text/plain", example: SwaggerErrors.INVALID_INPUT },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: SwaggerErrors.UNAUTHORIZED_DESCRIPTION,
    content: {
      "text/plain": {
        schema: {
          format: "text/plain",
          example: [SwaggerErrors.UNAUTHORIZED, AuthErrorMessages.INVALID_ID],
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
  @Patch("/:id")
  updateUserInfo(
    @Body() userNewData: UpdateUserInfoRequest,
    @User() user: JwtUserDto
  ) {
    return this.userService.updateUserInfo(userNewData, user);
  }

  //------------------------------------------ ************************ ------------------------------------------//
  @ApiOperation({ summary: "get user data." })
  @ApiResponse({
    status: 200,
    description: "get user data.",
    type: GetUserMeResultDto,
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
  @Get("/me")
  getMe(@User() user: JwtUserDto) {
    return this.userService.getUserData(user.userId);
  }
}
