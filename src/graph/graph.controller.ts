import { Controller, Get, Param } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { GraphService } from "./graph.service";

@ApiTags("graph")
@Controller("graph")
export class GraphController {
  constructor(private graphService: GraphService) {}

  @ApiOperation({ summary: "get graph data" })
  @Get("/tree/:id")
  getTree(@Param("id") id: string) {
    return this.graphService.getTreeData(id);
  }
}
