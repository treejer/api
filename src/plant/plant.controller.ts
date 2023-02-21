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
  EditTreeAssignPlantDto,
  TreePlantDto,
} from "./dtos";

import { JwtUserDto } from "src/auth/dtos";

@Controller("plant")
export class PlantController {
  constructor(private plantService: PlantService) {}

  @HasRoles(Role.PLANTER)
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Post("regular/add")
  plant(@Req() request: Request, @Body() dto: TreePlantDto) {
    const user = request.user;

    return this.plantService.plant(dto, user);
  }

  @HasRoles(Role.PLANTER)
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Patch("regular/edit/:id")
  editPlant(
    @Param("id") id: string,
    @Req() request: Request,
    @Body() body: TreePlantDto
  ) {
    const user = request.user;
    return this.plantService.editPlant(id, body, user);
  }

  // @HasRoles(Role.PLANTER)
  // @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Delete("regular/delete/:id")
  deletePlant(@Param("id") id: string, @Req() request: Request) {
    const user = request.user;

    return this.plantService.deletePlant(id, { user: 11111 });
  }

  @HasRoles(Role.PLANTER)
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Post("assignedTree/add")
  plantAssignedTree(
    @Body() dto: CreateAssignedTreePlantDto,
    @Req() request: Request
  ) {
    return this.plantService.plantAssignedTree(dto, request.user);
  }

  @HasRoles(Role.PLANTER)
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Patch("assignedTree/edit/:treeId")
  editAssignedTree(
    @Param("treeId") treeId: string,
    @Req() request: Request,
    @Body() dto: EditTreeAssignPlantDto
  ) {
    return this.plantService.editAssignedTree(treeId, dto, request.user);
  }

  @HasRoles(Role.PLANTER)
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Delete("assignedTree/delete/:treeId")
  deleteAssignedTree(@Param("treeId") treeId: string, @Req() request: Request) {
    this.plantService.deleteAssignedTree(treeId, request.user);
  }

  @HasRoles(Role.PLANTER)
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Post("update/add")
  updateTree(@Req() request: Request, @Body() body) {
    const user = request.user;
    return this.plantService.updateTree(body, user);
  }

  @HasRoles(Role.PLANTER)
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Patch("update/edit/:id")
  editUpdateTree(
    @Param("id") id: string,
    @Req() request: Request,
    @Body() body
  ) {
    const user = request.user;
    return this.plantService.editUpdateTree(id, body, user);
  }

  @HasRoles(Role.PLANTER)
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Delete("update/delete/:id")
  deleteUpdateTree(@Param("id") id: string, @Req() request: Request) {
    const user = request.user;

    return this.plantService.deleteUpdateTree(id, user);
  }
}
