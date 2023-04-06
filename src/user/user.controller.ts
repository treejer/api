import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";

import { UserService } from "./user.service";
import { HasRoles } from "src/auth/decorators";
import { AuthGuard } from "@nestjs/passport";
import { RolesGuard } from "src/auth/strategies";
import { Role } from "src/common/constants";
import { User } from "./decorators";
import { JwtUserDto } from "src/auth/dtos";
import { UpdateUserInfoRequest, ValidEmailDto } from "./dtos";

@ApiTags("user")
@Controller("users")
export class UserController {
  constructor(private userService: UserService) {}

  @ApiBearerAuth()
  // @HasRoles(Role.PLANTER)
  @UseGuards(AuthGuard("jwt"))
  @Patch("/email")
  updateEmail(@Body() dto: ValidEmailDto, @User() user: JwtUserDto) {
    return this.userService.updateEmail(dto, user);
  }

  @Get("/email/verify")
  verifyEmail(@Query("token") token: string) {
    return this.userService.verifyEmail(token);
  }

  @ApiBearerAuth()
  // @HasRoles(Role.PLANTER)
  @UseGuards(AuthGuard("jwt"))
  @Patch("/:id")
  updateUserInfo(
    @Param("id") id: string,
    @Body() userNewData: UpdateUserInfoRequest,
    @User() user: JwtUserDto
  ) {
    return this.userService.updateUserInfo(id, userNewData, user);
  }
}
