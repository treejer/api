import { Controller, Get, Param, Patch, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ApiTags } from "@nestjs/swagger";
import { HasRoles } from "src/auth/decorators";
import { RolesGuard } from "src/auth/strategies";
import { Role } from "src/common/constants";
import { PlantVerificationService } from "./plantVerification.service";

@ApiTags("plantVerification")
@Controller()
export class PlantVerificationController {
  constructor(private plantVerificationService: PlantVerificationService) {}

  @HasRoles(Role.ADMIN)
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Patch("plant_requests/:id/reject")
  rejectPlant(@Param("id") id: string) {
    return this.plantVerificationService.rejectPlant(id);
  }

  @Get("plant_requests/verification")
  getPlantRequests() {
    return this.plantVerificationService.getPlantRequests();
  }

  @HasRoles(Role.ADMIN)
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Patch("assigned_requests/:id/reject")
  rejectAssignedTree(@Param("id") id: string) {
    return this.plantVerificationService.rejectAssignedTree(id);
  }

  @Get("assigned_requests/verification")
  getAssignedTreeRequests() {
    return this.plantVerificationService.getAssignedTreeRequests();
  }

  @HasRoles(Role.ADMIN)
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Patch("update_requests/:id/reject")
  rejectUpdate(@Param("id") id: string) {
    return this.plantVerificationService.rejectUpdate(id);
  }

  @Get("update_requests/verification")
  getUpdateRequests() {
    return this.plantVerificationService.getUpdateRequests();
  }
}
