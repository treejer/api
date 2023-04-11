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
  @ApiOperation({ summary: "update email." })
  @ApiResponse({
    status: 200,
    description: "email successfully updated.",
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
    status: 500,
    description: "Response for Internal server error.",
    content: {
      "text/plain": {
        schema: { format: "text/plain", example: "Internal Server Error" },
      },
    },
  })
  @UseGuards(AuthGuard("jwt"))
  @Patch("/email")
  updateEmail(@Body() dto: ValidEmailDto, @User() user: JwtUserDto) {
    return this.userService.updateEmail(dto, user);
  }

  @ApiOperation({ summary: "verify email." })
  @ApiResponse({
    status: 200,
    description: "email successfully verified.",
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
    status: 500,
    description: "Response for Internal server error.",
    content: {
      "text/plain": {
        schema: { format: "text/plain", example: "Internal Server Error" },
      },
    },
  })
  @Get("/email/verify")
  verifyEmail(@Query("token") token: string) {
    return this.userService.verifyEmail(token);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: "update user info." })
  @ApiResponse({
    status: 200,
    description: "user info successfully updated.",
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
    status: 500,
    description: "Response for Internal server error.",
    content: {
      "text/plain": {
        schema: { format: "text/plain", example: "Internal Server Error" },
      },
    },
  })
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
