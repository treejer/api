import { Body, Controller, Get, Param, Patch, UseGuards } from "@nestjs/common";
import { AdminService } from "./admin.service";
import { AuthGuard } from "@nestjs/passport";
import { Role } from "./../common/constants";
import { ApiTags } from "@nestjs/swagger";
import { HasRoles } from "src/auth/decorators";
import { RolesGuard } from "src/auth/strategies";
import { UserVerificationByAdminDto } from "./dto";

@ApiTags("admin")
@Controller()
export class AdminController {
  constructor(private adminService: AdminService) {}

  @HasRoles(Role.ADMIN)
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Get("users")
  async getUsers() {}

  @HasRoles(Role.ADMIN)
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Get("users/:userId")
  async getUserById(@Param("userId") userId: string) {}

  @HasRoles(Role.ADMIN)
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Get("users-by-wallet/:wallet")
  async getUserByWallet(@Param("wallet") wallet: string) {}

  @HasRoles(Role.ADMIN)
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Get("applications")
  async getApplications() {}

  @HasRoles(Role.ADMIN)
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Patch("verify")
  async verifyUser(@Body() dto: UserVerificationByAdminDto) {}

  @HasRoles(Role.ADMIN)
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Patch("reject")
  async rejectUser(@Body() dto: UserVerificationByAdminDto) {}
}
