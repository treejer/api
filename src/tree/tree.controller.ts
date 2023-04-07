import { Controller, Get, Param } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { TreeService } from "./tree.service";

@ApiTags("trees")
@Controller("trees")
export class TreeController {
  constructor(private treeService: TreeService) {}

  @Get("/:id")
  getTree(@Param("id") id: string) {
    return this.treeService.getTree(id);
  }
}
