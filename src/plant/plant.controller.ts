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
import { CreateTreePlantDto } from "./dtos/create-treePlant.dto";
import { AuthGuard } from "@nestjs/passport";
import { RolesGuard } from "../auth/strategies";
import { HasRoles } from "../auth/decorators";
import { Role } from "../common/constants";
<<<<<<< HEAD
import { CreateAssignedTreePlantDto } from "./dtos";
=======
import { EditTreePlantDto } from "./dtos";
import { JwtUserDto } from "src/auth/dtos";
>>>>>>> 22ccb2176353da17d0f8adde371774e1bdb7508e

@Controller("plant")
export class PlantController {
  constructor(private plantService: PlantService) {}

  @HasRoles(Role.PLANTER)
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Post("regular/add")
  plant(@Req() request: Request, @Body() dto: CreateTreePlantDto) {
    const user = request.user;

    return this.plantService.plant(dto, user);
  }

  @HasRoles(Role.PLANTER)
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Patch("regular/edit/:id")
  editPlant(
    @Param("id") id: string,
    @Req() request: Request,
    @Body() body: EditTreePlantDto
  ) {
    const user = request.user;
    return this.plantService.editPlant(id, body, user);
  }
  @Patch("regular/edit2/:id")
  editPlant2(@Param("id") id: string, @Body() body: EditTreePlantDto) {
    return this.plantService.editPlanData(id, body);
  }

  @HasRoles(Role.PLANTER)
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Delete("regular/delete/:id")
  deletePlant(@Param("id") id: string, @Req() request: Request) {
    const user = request.user;

    return this.plantService.deletePlant(id, user);
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
  @Patch("assignedTree/edit/:id")
  editAssignedTree(
    @Param("id") id: string,
    @Req() request: Request,
    @Body() body
  ) {
    const user = request.user;
    return this.plantService.editUpdateTree(id, user);
  }

  @HasRoles(Role.PLANTER)
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Delete("assignedTree/delete/:id")
  deleteAssignedTree(@Param("id") id: string, @Req() request: Request) {
    const user = request.user;

    this.plantService.deleteAssignedTree(id, user);
  }

  @HasRoles(Role.PLANTER)
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Post("update/add")
  updateTree(@Body() body) {
    return this.plantService.updateTree(body);
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
    return this.plantService.editUpdateTree(id, user);
  }

  @HasRoles(Role.PLANTER)
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Delete("update/delete/:id")
  deleteUpdateTree(@Param("id") id: string, @Req() request: Request) {
    const user = request.user;

    return this.plantService.deleteUpdateTree(id, user);
  }
}
