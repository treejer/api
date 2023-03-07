import {
  Controller,
  Body,
  Post,
  Delete,
  Param,
  Patch,
  UseGuards,
  HttpCode,
  Req,
} from "@nestjs/common";

import { Role } from "src/common/constants";
import { User } from "src/user/decorators";
import { JwtUserDto } from "src/auth/dtos";
import { HasRoles } from "src/auth/decorators";
import { RolesGuard } from "src/auth/strategies";
import { PlantService } from "./plant.service";
import { AuthGuard } from "@nestjs/passport";

import {
  CreateAssignedTreePlantDto,
  CreateUpdateTreeDto,
  DeleteResult,
  EditTreeAssignPlantDto,
  EditUpdateTreeDto,
  TreePlantDto,
} from "./dtos";
import { CreateResult, EditResult } from "./dtos";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";

@Controller()
@ApiTags("plant")
export class PlantController {
  constructor(private plantService: PlantService) {}

  @ApiBearerAuth()
  @ApiOperation({ summary: "create plant request." })
  @ApiResponse({
    status: 201,
    description: "plant request has been successfully created.",
    type: CreateResult,
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
    description: "Response for Internal server errror.",
    content: {
      "text/plain": {
        schema: { format: "text/plain", example: "Internal Server Error" },
      },
    },
  })
  @HasRoles(Role.PLANTER)
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Post("plant_requests")
  plant(
    @Body() dto: TreePlantDto,
    @User() user: JwtUserDto,
  ): Promise<CreateResult> {
    return this.plantService.plant(dto, user);
  }

  // @ApiBearerAuth()
  // @UseGuards(AuthGuard("jwt"))
  // @Post("plant_requests2")
  // plant2(@Req() req: Request) {
  //   // console.log("req errors", req.body.events[0]);
  // }

  @ApiBearerAuth()
  @ApiOperation({ summary: "edit plant request" })
  @ApiResponse({
    status: 200,
    description: "plant request has been successfully edited.",
    type: EditResult,
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
    description: "Response for Internal server errror.",
    content: {
      "text/plain": {
        schema: { format: "text/plain", example: "Internal server error" },
      },
    },
  })
  @HasRoles(Role.PLANTER)
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Patch("plant_requests/:id")
  editPlant(
    @Param("id") id: string,
    @Body() dto: TreePlantDto,
    @User() user: JwtUserDto,
  ): Promise<EditResult> {
    return this.plantService.editPlant(id, dto, user);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: "delete plant request." })
  @ApiResponse({
    status: 204,
    description: "plant request has been successfully deleted.",
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
    description: "Response for Internal server errror.",
    content: {
      "text/plain": {
        schema: { format: "text/plain", example: "Internal server error" },
      },
    },
  })
  @HttpCode(204)
  @HasRoles(Role.PLANTER)
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Delete("plant_requests/:id")
  deletePlant(@Param("id") id: string, @User() user: JwtUserDto) {
    return this.plantService.deletePlant(id, user);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: "create assigned request." })
  @ApiResponse({
    status: 201,
    description: "assigned request has been successfully created.",
    type: CreateResult,
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
    description: "Response for Internal server errror.",
    content: {
      "text/plain": {
        schema: { format: "text/plain", example: "Internal Server Error" },
      },
    },
  })
  @HasRoles(Role.PLANTER)
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Post("assigned_requests")
  plantAssignedTree(
    @Body() dto: CreateAssignedTreePlantDto,
    @User() user: JwtUserDto,
  ) {
    return this.plantService.plantAssignedTree(dto, user);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: "edit assigned request" })
  @ApiResponse({
    status: 200,
    description: "assigned request has been successfully edited.",
    type: EditResult,
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
    description: "Response for Internal server errror.",
    content: {
      "text/plain": {
        schema: { format: "text/plain", example: "Internal server error" },
      },
    },
  })
  @HasRoles(Role.PLANTER)
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Patch("assigned_requests/:id")
  editAssignedTree(
    @Param("id") id: string,
    @Body() dto: EditTreeAssignPlantDto,
    @User() user: JwtUserDto,
  ) {
    return this.plantService.editAssignedTree(id, dto, user);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: "delete assigned request." })
  @ApiResponse({
    status: 204,
    description: "assigned request has been successfully deleted.",
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
    description: "Response for Internal server errror.",
    content: {
      "text/plain": {
        schema: { format: "text/plain", example: "Internal server error" },
      },
    },
  })
  @HttpCode(204)
  @HasRoles(Role.PLANTER)
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Delete("assigned_requests/:id")
  deleteAssignedTree(@Param("id") id: string, @User() user: JwtUserDto) {
    return this.plantService.deleteAssignedTree(id, user);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: "create update request." })
  @ApiResponse({
    status: 201,
    description: "update request has been successfully created.",
    type: CreateResult,
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
    description: "Response for Internal server errror.",
    content: {
      "text/plain": {
        schema: { format: "text/plain", example: "Internal Server Error" },
      },
    },
  })
  @HasRoles(Role.PLANTER)
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Post("update_requests")
  updateTree(@Body() body: CreateUpdateTreeDto, @User() user: JwtUserDto) {
    return this.plantService.updateTree(body, user);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: "edit update request" })
  @ApiResponse({
    status: 200,
    description: "update request has been successfully edited.",
    type: EditResult,
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
    description: "Response for Internal server errror.",
    content: {
      "text/plain": {
        schema: { format: "text/plain", example: "Internal server error" },
      },
    },
  })
  @HasRoles(Role.PLANTER)
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Patch("update_requests/:id")
  editUpdateTree(
    @Param("id") id: string,
    @Body() body: EditUpdateTreeDto,
    @User() user: JwtUserDto,
  ) {
    return this.plantService.editUpdateTree(id, body, user);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: "delete update request." })
  @ApiResponse({
    status: 204,
    description: "update request has been successfully deleted.",
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
    description: "Response for Internal server errror.",
    content: {
      "text/plain": {
        schema: { format: "text/plain", example: "Internal server error" },
      },
    },
  })
  @HttpCode(204)
  @HasRoles(Role.PLANTER)
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Delete("update_requests/:id")
  deleteUpdateTree(@Param("id") id: string, @User() user: JwtUserDto) {
    return this.plantService.deleteUpdateTree(id, user);
  }
}
