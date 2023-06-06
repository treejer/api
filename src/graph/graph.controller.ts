import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { GraphService } from "./graph.service";
import { HasRoles } from "src/auth/decorators";
import { Role } from "src/common/constants";
import { RolesGuard } from "src/auth/strategies";
import { AuthGuard } from "@nestjs/passport";

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


  @HasRoles(Role.PLANTER)
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @ApiOperation({ summary: "get graph planter data" })
  @Get("/submitted/:id")
  getSubmittedData(@Param("id") id: string) {
    return this.graphService.getPlanterData(id);
  }
}
