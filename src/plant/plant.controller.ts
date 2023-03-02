import {
  Controller,
  Body,
  Post,
  Delete,
  Param,
  Patch,
  UseGuards,
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
  EditTreeAssignPlantDto,
  EditUpdateTreeDto,
  TreePlantDto,
} from "./dtos";

@Controller("plant")
export class PlantController {
  constructor(private plantService: PlantService) {}

  @HasRoles(Role.PLANTER)
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Post("regular/add")
  plant(@Body() dto: TreePlantDto, @User() user: JwtUserDto): Promise<string> {
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
