import { Controller, Get, Param } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { SwaggerErrors, TreeErrorMessage } from "src/common/constants";
import { TreeService } from "./tree.service";

@ApiTags("trees")
@Controller("trees")
export class TreeController {
  constructor(private treeService: TreeService) {}

  @ApiOperation({ summary: "get tree data" })
  @ApiResponse({
    status: 200,
    description: "get tree data successfully.",
  })
  @ApiResponse({
    status: 404,
    description: "tree not found",
    content: {
      "text/plain": {
        schema: {
          format: "text/plain",
          example: TreeErrorMessage.TREE_NOT_FOUND,
        },
      },
    },
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
  @Get("/:id")
  getTree(@Param("id") id: string) {
    return this.treeService.getTree(id);
  }
}
