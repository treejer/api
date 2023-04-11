import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { EtherValuesService } from "./etherValues.service";

@Controller("ether")
@ApiTags("ether")
export class EtherValuesController {
  constructor(private etherValuesService: EtherValuesService) {}

  @ApiOperation({ summary: "get ether value data" })
  @ApiResponse({
    status: 200,
    description: "get ether value data successfully.",
  })
  @ApiResponse({
    status: 500,
    description: "Response for Internal server error.",
    content: {
      "text/plain": {
        schema: { format: "text/plain", example: "Internal Server Error" },
      },
    },
  })
  @Get("/prices")
  getEtherPrice() {
    return this.etherValuesService.getEtherPrice();
  }
}
