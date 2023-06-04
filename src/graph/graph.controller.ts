import { Controller, Get, Param } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { GraphService } from "./graph.service";

@ApiTags("trees")
@Controller("graph")
export class GraphController {
  constructor(private graphService: GraphService) {}

  @Get("/tree/:id")
  getTree(@Param("id") id: string) {
    return this.graphService.getTreeData(id);
  }
}
