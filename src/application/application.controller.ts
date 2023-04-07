import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { Role } from "./../common/constants";
import { ApiBody, ApiConsumes, ApiTags } from "@nestjs/swagger";
import { HasRoles } from "src/auth/decorators";
import { RolesGuard } from "src/auth/strategies";

import { UserDto } from "src/user/dtos";
import { AdminService } from "src/admin/admin.service";
import { JwtUserDto } from "src/auth/dtos";
import { User } from "src/user/decorators";
import { ApplicationService } from "./application.service";
import { FileExtender } from "./ccc";
import { FileInterceptor } from "@nestjs/platform-express";
import { UploadData } from "src/download/decorators";

import { ApplocationUpdateDto } from "./dtos";

@ApiTags("application")
@Controller("application")
export class ApplicationController {
  constructor(private applicationservice: ApplicationService) {}

  // @HasRoles(Role.ADMIN)
  // @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Post()
  @ApiConsumes("multipart/form-data")
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
  async update(@Req() req, @UploadData() updateData: ApplocationUpdateDto) {
    console.log("uploadData", updateData);
    return this.applicationservice.updateUser(
      "6421af57b3501e8c65b93a44",
      updateData,
      req
    );
  }
}
