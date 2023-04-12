import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { SwaggerErrors } from "src/common/constants";
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
    description: SwaggerErrors.INTERNAL_SERVER_ERROR_DESCRIPTION,
    content: {
      "text/plain": {
        schema: {
          format: "text/plain",
          example: SwaggerErrors.INTERNAL_SERVER_ERROR,
        },
      },
    },
  })
  @Get("/prices")
  getEtherPrice() {
    return this.etherValuesService.getEtherPrice();
  }
}
