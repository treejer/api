import { GraphService } from "./graph.service";
import { Module } from "@nestjs/common";
import { GraphController } from "./graph.controller";

@Module({
  imports: [],
  controllers: [GraphController],
  providers: [GraphService],
  exports: [GraphService],
})
export class GraphModule {}
