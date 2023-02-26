import { Controller, Get, Put, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { HasRoles } from "../auth/decorators";
import { RolesGuard } from "../auth/strategies";
import { Role } from "../common/constants";
import { PlantVerificationService } from "./plantVerification.service";

@Controller("plantVerification")
export class PlantVerificationController {
  constructor(private plantVerificationService: PlantVerificationService) {}

  @HasRoles(Role.PLANTER)
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Put("plant/reject")
  rejectPlant() {
    // return this.plantVerificationService.rejectPlant();
  }
  @Get("plant/getRequests")
  getPlantRequests() {
    return this.plantVerificationService.getPlantRequests();
  }

  @Put("assignedTree/reject")
  rejectAssignedTree() {
    // return this.plantVerificationService.rejectAssignedTree();
  }
  @Get("assignedTree/getRequests")
  getAssignedTreeRequests() {
    return this.plantVerificationService.getAssignedTreeRequests();
  }

  @Put("update/reject")
  rejectUpdate() {
    // return this.plantVerificationService.rejectUpdate();
  }
  @Get("update/getRequests")
  getUpdateRequests() {
    return this.plantVerificationService.getUpdateRequests();
  }
}
