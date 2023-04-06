import { Controller, Get } from "@nestjs/common";

import { PlantStatus, Role } from "src/common/constants";
import { User } from "src/user/decorators";
import { JwtUserDto } from "src/auth/dtos";
import { HasRoles } from "src/auth/decorators";
import { RolesGuard } from "src/auth/strategies";
import { AuthGuard } from "@nestjs/passport";

import { ApiTags } from "@nestjs/swagger";
import { EtherValuesService } from "./etherValues.service";

@Controller("ether")
@ApiTags("ether")
export class EtherValuesController {
  constructor(private etherValuesService: EtherValuesService) {}

  @Get("/prices")
  editAssignedTree() {
    return this.etherValuesService.getEtherPrice();
  }
}
