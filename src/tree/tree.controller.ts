import { Controller, Get, Param } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
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
        schema: { format: "text/plain", example: "Tree not Found" },
      },
    },
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
  @Get("/:id")
  getTree(@Param("id") id: string) {
    return this.treeService.getTree(id);
  }
}
