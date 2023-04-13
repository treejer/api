import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from "@nestjs/common";
import { AdminService } from "./admin.service";
import { AuthGuard } from "@nestjs/passport";
import {
  AdminErrorMessage,
  AdminServiceMessage,
  Role,
  SwaggerErrors,
} from "./../common/constants";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { HasRoles } from "src/auth/decorators";
import { RolesGuard } from "src/auth/strategies";
import { GetUserResultDto, UserVerificationByAdminDto } from "./dto";
import { ApplicationResultDto } from "src/application/dtos";

@ApiTags("admin")
@Controller("admin")
export class AdminController {
  constructor(private adminService: AdminService) {}

  @ApiBearerAuth()
  @ApiOperation({ summary: "get user data" })
  @ApiResponse({
    status: 200,
    description: "get user data successfully.",
    type: [GetUserResultDto],
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
  @HasRoles(Role.ADMIN)
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Get("users")
  async getUsers(@Query("filters") filters: string) {
    if (!filters || filters.length === 0) filters = "{}";
    return this.adminService.getUsers(JSON.parse(decodeURIComponent(filters)));
  }

  //------------------------------------------ ************************ ------------------------------------------//
  @ApiBearerAuth()
  @ApiOperation({ summary: "get user data by userId" })
  @ApiResponse({
    status: 200,
    description: "get user data successfully.",
    type: GetUserResultDto,
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
    status: 404,
    description: SwaggerErrors.NOT_FOUND_DESCRIPTION,
    content: {
      "text/plain": {
        schema: {
          format: "text/plain",
          example: AdminErrorMessage.USER_NOT_FOUND,
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
  @HasRoles(Role.ADMIN)
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Get("users/:userId")
  async getUserById(@Param("userId") userId: string) {
    return await this.adminService.getUserById(userId);
  }
  //------------------------------------------ ************************ ------------------------------------------//
  @ApiBearerAuth()
  @ApiOperation({ summary: "get user data by wallet" })
  @ApiResponse({
    status: 200,
    description: "get user data successfully.",
    type: GetUserResultDto,
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
        schema: { format: "text/plain", example: SwaggerErrors.UNAUTHORIZED },
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
          example: AdminErrorMessage.USER_NOT_FOUND,
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
  @HasRoles(Role.ADMIN)
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Get("users-by-wallet/:wallet")
  async getUserByWallet(@Param("wallet") wallet: string) {
    return await this.adminService.getUserByWallet(wallet);
  }

  //------------------------------------------ ************************ ------------------------------------------//
  @ApiBearerAuth()
  @ApiOperation({ summary: "get application data" })
  @ApiResponse({
    status: 200,
    description: "get application data successfully.",
    type: [ApplicationResultDto],
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
  @HasRoles(Role.ADMIN)
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Get("applications")
  async getApplications(@Query("filters") filters: string) {
    if (!filters || filters.length === 0) filters = "{}";
    return await this.adminService.getApplications(
      JSON.parse(decodeURIComponent(filters))
    );
  }

  //------------------------------------------ ************************ ------------------------------------------//

  @ApiBearerAuth()
  @ApiOperation({ summary: "verify user" })
  @ApiResponse({
    status: 200,
    description: "user verified successfully.",
    content: {
      "text/plain": {
        example: AdminServiceMessage.VERIFY_MESSAGE,
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
    status: 404,
    description: SwaggerErrors.NOT_FOUND_DESCRIPTION,
    content: {
      "text/plain": {
        schema: {
          format: "text/plain",
          example: AdminErrorMessage.APPLICATION_NOT_SUBMITTED,
        },
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: "Response for verified users.",
    content: {
      "text/plain": {
        schema: {
          format: "text/plain",
          example: AdminErrorMessage.ALREADY_VERIFIED,
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
  @HasRoles(Role.ADMIN)
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Patch("verify")
  async verifyUser(@Body() dto: UserVerificationByAdminDto) {
    return await this.adminService.verifyUser(dto.userId);
  }

  //------------------------------------------ ************************ ------------------------------------------//
  @ApiBearerAuth()
  @ApiOperation({ summary: "reject user" })
  @ApiResponse({
    status: 200,
    description: "user rejected successfully.",
    content: {
      "text/plain": {
        example: AdminServiceMessage.REJECT_MESSAGE,
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
    status: 404,
    description: SwaggerErrors.NOT_FOUND_DESCRIPTION,
    content: {
      "text/plain": {
        schema: {
          format: "text/plain",
          example: AdminErrorMessage.APPLICATION_NOT_SUBMITTED,
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
  @HasRoles(Role.ADMIN)
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Patch("reject")
  async rejectUser(@Body() dto: UserVerificationByAdminDto) {
    return await this.adminService.rejectUser(dto.userId);
  }
}
