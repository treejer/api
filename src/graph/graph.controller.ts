import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { HasRoles } from "src/auth/decorators";
import { JwtUserDto } from "src/auth/dtos";
import { RolesGuard } from "src/auth/strategies";
import { Role } from "src/common/constants";
import { User } from "src/user/decorators";
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


  @HasRoles(Role.PLANTER)
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @ApiOperation({ summary: "get graph planter data" })
  @Get("/submitted/me")
  getSubmittedData(
  @User() user: JwtUserDto,
  @Query("skip") skip: number,
  @Query("limit") limit: number) {
    return this.graphService.getSubmittedData(user.walletAddress,skip,limit);
  }
}
