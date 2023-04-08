import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { Role } from "./../common/constants";
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from "@nestjs/swagger";
import { HasRoles } from "src/auth/decorators";
import { RolesGuard } from "src/auth/strategies";

import { UserDto } from "src/user/dtos";
import { AdminService } from "src/admin/admin.service";
import { JwtUserDto } from "src/auth/dtos";
import { User } from "src/user/decorators";
import { ApplicationService } from "./application.service";

import { FileInterceptor } from "@nestjs/platform-express";
import { UploadData } from "src/download/decorators";

import { ApplocationUpdateDto } from "./dtos";

@ApiTags("application")
@Controller("application")
export class ApplicationController {
  constructor(private applicationservice: ApplicationService) {}

  @UseGuards(AuthGuard("jwt"))
  @Post()
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
  async update(@Req() req, @User() user: JwtUserDto) {
    return this.applicationservice.updateUser(user.userId, req);
  }
}
