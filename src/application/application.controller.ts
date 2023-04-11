import { Controller, Post, Req, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";

import { JwtUserDto } from "src/auth/dtos";
import { User } from "src/user/decorators";
import { ApplicationService } from "./application.service";

@ApiTags("application")
@Controller("application")
export class ApplicationController {
  constructor(private applicationservice: ApplicationService) {}

  @ApiOperation({ summary: "submit application for user" })
  @ApiResponse({
    status: 201,
    description: "application submitted successfully.",
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
    status: 409,
    description: "application already submitted",
    content: {
      "text/plain": {
        schema: {
          format: "text/plain",
          example: "Application already submitted",
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
  @ApiConsumes("multipart/form-data")
  @ApiBearerAuth()
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        firstName: { type: "string" },
        lastName: { type: "string" },
        type: { type: "number" },
        organizationAddress: { type: "string" },
        referrer: { type: "string" },
        longitude: { type: "number" },
        latitude: { type: "number" },

        file: {
          type: "string",
          format: "binary",
        },
      },
    },
  })
  @UseGuards(AuthGuard("jwt"))
  @Post()
  async update(@Req() req, @User() user: JwtUserDto) {
    return this.applicationservice.updateUser(user.userId, req);
  }
}
