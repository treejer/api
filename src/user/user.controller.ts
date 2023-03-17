import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";

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

  // @HasRoles(Role.PLANTER)
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Patch("/:id")
  updateUserInfo(
    @Param("id") id: string,
    @Body() userNewData: UpdateUserInfoRequest,
    @User() user: JwtUserDto,
  ) {
    return this.userService.updateUserInfo(id, userNewData, user);
  }

  // @HasRoles(Role.PLANTER)
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Patch("/email")
  updateEmail(@Body() email: ValidEmailDto, @User() user: JwtUserDto) {
    return this.userService.updateUserEmail(email, user);
  }
}
