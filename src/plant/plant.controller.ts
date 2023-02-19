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

@UseGuards(AuthGuard("jwt"))
@Controller("plant")
export class PlantController {
  constructor(private plantService: PlantService) {}

  @UseGuards(AuthGuard("jwt"))
  @Post("assignedTree/add")
  plantAssignedTree(@Body() body) {
    return this.plantService.plantAssignedTree(body);
  }

  @UseGuards(AuthGuard("jwt"))
  @Patch("assignedTree/edit/:id")
  editAssignedTree(
    @Param("id") id: string,
    @Req() request: Request,
    @Body() body
  ) {
    const user = request.user;
    return this.plantService.editUpdateTree(id, user);
  }

  @UseGuards(AuthGuard("jwt"))
  @Delete("assignedTree/delete/:id")
  deleteAssignedTree(@Param("id") id: string, @Req() request: Request) {
    const user = request.user;

    this.plantService.deleteAssignedTree(id, user);
  }

  @Post("regular/add")
  plant(@Body() dto: CreateTreePlantDto) {
    return this.plantService.plant(dto);
  }

  @UseGuards(AuthGuard("jwt"))
  @Patch("assignedTree/edit/:id")
  editPlant(@Param("id") id: string, @Req() request: Request, @Body() body) {
    const user = request.user;
    return this.plantService.editPlant(id, user);
  }

  @UseGuards(AuthGuard("jwt"))
  @Delete("assignedTree/delete/:id")
  deletePlant(@Param("id") id: string, @Req() request: Request) {
    const user = request.user;

    return this.plantService.deletePlant(id, user);
  }

  @Post("update/add")
  updateTree(@Body() body) {
    return this.plantService.updateTree(body);
  }

  @UseGuards(AuthGuard("jwt"))
  @Patch("assignedTree/edit/:id")
  editUpdateTree(
    @Param("id") id: string,
    @Req() request: Request,
    @Body() body
  ) {
    const user = request.user;
    return this.plantService.editUpdateTree(id, user);
  }

  @UseGuards(AuthGuard("jwt"))
  @Delete("assignedTree/delete/:id")
  deleteUpdateTree(@Param("id") id: string, @Req() request: Request) {
    const user = request.user;

    return this.plantService.deleteUpdateTree(id, user);
  }
}
