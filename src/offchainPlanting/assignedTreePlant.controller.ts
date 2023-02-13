import { Controller, Get, Body, Post } from "@nestjs/common";
import { Request } from "express";
import { AssignedTreePlantService } from "./assignedTreePlant.service";
import { CreateTreePlantDto } from "./dtos/create-treePlant.dto";

@Controller()
export class AssignedTreePlantController {
  constructor(private assignedTreePlantService: AssignedTreePlantService) {}

  @Post("me")
  GetMe(@Body() body) {
    return this.assignedTreePlantService.create(body);
  }

  @Post("treePlant/plant")
  Plant(@Body() dto: CreateTreePlantDto) {
    return this.assignedTreePlantService.plant(dto);
  }

  @Post("offchainPlanting/update")
  updateTree(@Body() body) {
    return this.assignedTreePlantService.updateTree(body);
  }
}
