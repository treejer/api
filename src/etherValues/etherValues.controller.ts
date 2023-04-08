import { Controller, Get } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { EtherValuesService } from "./etherValues.service";

@Controller("ether")
@ApiTags("ether")
export class EtherValuesController {
  constructor(private etherValuesService: EtherValuesService) {}

  @Get("/prices")
  getEtherPrice() {
    return this.etherValuesService.getEtherPrice();
  }
}
