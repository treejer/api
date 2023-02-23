import {
  Controller,
  Get,
  Body,
  Post,
  Req,
  Res,
  Redirect,
  Query,
  Delete,
  Param,
  Patch,
  UseGuards,
} from "@nestjs/common";
import { Request } from "express";
import { PlantService } from "./plant.service";
import { AuthGuard } from "@nestjs/passport";
import { RolesGuard } from "../auth/strategies";
import { HasRoles } from "../auth/decorators";
import { Role } from "../common/constants";

import {
  CreateAssignedTreePlantDto,
  CreateUpdateTreeDto,
  EditTreeAssignPlantDto,
  EditUpdateTreeDto,
  TreePlantDto,
} from "./dtos";
import { JwtUserDto } from "../auth/dtos";
import { User } from "../user/decorators";

@Controller("plant")
export class PlantController {
  constructor(private plantService: PlantService) {}

  // @HasRoles(Role.PLANTER)
  // @UseGuards(AuthGuard("jwt"))
  @Post("regular/add")
  plant(@Body() dto: TreePlantDto, @User() user: JwtUserDto): Promise<string> {
    console.log("dddddddd", user);

    return this.plantService.plant(dto, user);
  }

  @HasRoles(Role.PLANTER)
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Patch("regular/edit/:id")
  editPlant(
    @Param("id") id: string,
    @Body() dto: TreePlantDto,
    @User() user: JwtUserDto
  ) {
    return this.plantService.editPlant(id, dto, user);
  }

  @HasRoles(Role.PLANTER)
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Delete("regular/delete/:id")
  deletePlant(@Param("id") id: string, @User() user: JwtUserDto) {
    return this.plantService.deletePlant(id, user);
  }

  @HasRoles(Role.PLANTER)
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Post("assignedTree/add")
  plantAssignedTree(
    @Body() dto: CreateAssignedTreePlantDto,
    @User() user: JwtUserDto
  ) {
    return this.plantService.plantAssignedTree(dto, user);
  }

  @HasRoles(Role.PLANTER)
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Patch("assignedTree/edit/:id")
  editAssignedTree(
    @Param("id") id: string,
    @Body() dto: EditTreeAssignPlantDto,
    @User() user: JwtUserDto
  ) {
    return this.plantService.editAssignedTree(id, dto, user);
  }

  @HasRoles(Role.PLANTER)
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Delete("assignedTree/delete/:id")
  deleteAssignedTree(@Param("id") id: string, @User() user: JwtUserDto) {
    return this.plantService.deleteAssignedTree(id, user);
  }

  @HasRoles(Role.PLANTER)
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Post("update/add")
  updateTree(@Body() body: CreateUpdateTreeDto, @User() user: JwtUserDto) {
    return this.plantService.updateTree(body, user);
  }

  @HasRoles(Role.PLANTER)
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Patch("update/edit/:id")
  editUpdateTree(
    @Param("id") id: string,
    @Body() body: EditUpdateTreeDto,
    @User() user: JwtUserDto
  ) {
    return this.plantService.editUpdateTree(id, body, user);
  }

  @HasRoles(Role.PLANTER)
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Delete("update/delete/:id")
  deleteUpdateTree(@Param("id") id: string, @User() user: JwtUserDto) {
    return this.plantService.deleteUpdateTree(id, user);
  }
}
