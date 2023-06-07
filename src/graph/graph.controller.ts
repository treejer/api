import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
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

  @ApiOperation({ summary: "get graph planter data" })
  @Get("/planter/:id")
  getPlanterData(@Param("id") id: string) {
    return this.graphService.getPlanterData(id);
  }
}
