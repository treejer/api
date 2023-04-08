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
import { ApiTags } from "@nestjs/swagger";
import { HasRoles } from "src/auth/decorators";
import { RolesGuard } from "src/auth/strategies";
import { UserVerificationByAdminDto } from "./dto";

@ApiTags("admin")
@Controller("admin")
export class AdminController {
  constructor(private adminService: AdminService) {}

  @HasRoles(Role.ADMIN)
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Get("users")
  async getUsers(@Query("filters") filters: string) {
    if (!filters || filters.length === 0) filters = "{}";
    return this.adminService.getUsers(JSON.parse(decodeURIComponent(filters)));
  }

  @HasRoles(Role.ADMIN)
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Get("users/:userId")
  async getUserById(@Param("userId") userId: string) {
    return await this.adminService.getUserById(userId);
  }

  @HasRoles(Role.ADMIN)
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Get("users-by-wallet/:wallet")
  async getUserByWallet(@Param("wallet") wallet: string) {
    return await this.adminService.getUserByWallet(wallet);
  }

  @HasRoles(Role.ADMIN)
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Get("applications")
  async getApplications(@Query("filters") filters: string) {
    if (!filters || filters.length === 0) filters = "{}";
    return await this.adminService.getApplications(
      JSON.parse(decodeURIComponent(filters))
    );
  }

  @HasRoles(Role.ADMIN)
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Patch("verify")
  async verifyUser(@Body() dto: UserVerificationByAdminDto) {
    return await this.adminService.verifyUser(dto.userId);
  }

  @HasRoles(Role.ADMIN)
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Patch("reject")
  async rejectUser(@Body() dto: UserVerificationByAdminDto) {
    return await this.adminService.rejectUser(dto.userId);
  }
}
