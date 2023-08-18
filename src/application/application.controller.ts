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
import { ApplicationErrorMessage, SwaggerErrors } from "src/common/constants";
import { User } from "src/user/decorators";
import { ApplicationService } from "./application.service";
import { CreateApplicationResultDto } from "./dtos/create-application.dto";

@ApiTags("application")
@Controller("application")
export class ApplicationController {
  constructor(private applicationservice: ApplicationService) {}

  @ApiOperation({ summary: "submit application for user" })
  @ApiResponse({
    status: 201,
    description: "application submitted successfully.",
    type: CreateApplicationResultDto,
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
    status: 409,
    description: "application already submitted",
    content: {
      "text/plain": {
        schema: {
          format: "text/plain",
          example: ApplicationErrorMessage.APPLICATION_ALREADY_SUBMITTED,
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
