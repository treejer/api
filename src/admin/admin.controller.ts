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
import { Role } from "./../common/constants";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { HasRoles } from "src/auth/decorators";
import { RolesGuard } from "src/auth/strategies";
import { UserVerificationByAdminDto } from "./dto";

@ApiTags("admin")
@Controller("admin")
export class AdminController {
  constructor(private adminService: AdminService) {}

  @ApiBearerAuth()
  @ApiOperation({ summary: "get user data" })
  @ApiResponse({
    status: 200,
    description: "get user data successfully.",
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
    status: 500,
    description: "Response for Internal server error.",
    content: {
      "text/plain": {
        schema: { format: "text/plain", example: "Internal Server Error" },
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
    status: 404,
    description: "user not found",
    content: {
      "text/plain": {
        schema: { format: "text/plain", example: "User not found!" },
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: "Response for Internal server error.",
    content: {
      "text/plain": {
        schema: { format: "text/plain", example: "Internal Server Error" },
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
  })
  @ApiResponse({
    status: 400,
    description: "Response for invalid input",
    content: {
      "text/plain": {
        schema: { format: "text/plain", example: "Invalid Input" },
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
    status: 404,
    description: "user not found",
    content: {
      "text/plain": {
        schema: { format: "text/plain", example: "User not found!" },
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: "Response for Internal server error.",
    content: {
      "text/plain": {
        schema: { format: "text/plain", example: "Internal server error" },
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
    status: 500,
    description: "Response for Internal server error.",
    content: {
      "text/plain": {
        schema: { format: "text/plain", example: "Internal Server Error" },
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
    status: 404,
    description: "application not submitted for this user",
    content: {
      "text/plain": {
        schema: {
          format: "text/plain",
          example: "Application not submitted for this user",
        },
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: "Response for verified users.",
    content: {
      "text/plain": {
        schema: { format: "text/plain", example: "Already Verified" },
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: "Response for Internal server error.",
    content: {
      "text/plain": {
        schema: { format: "text/plain", example: "Internal Server Error" },
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
    status: 404,
    description: "application not submitted for this user",
    content: {
      "text/plain": {
        schema: {
          format: "text/plain",
          example: "Application not submitted for this user",
        },
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: "Response for Internal server error.",
    content: {
      "text/plain": {
        schema: { format: "text/plain", example: "Internal Server Error" },
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
