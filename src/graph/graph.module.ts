import { GraphService } from "./graph.service";
import { Module } from "@nestjs/common";

@Module({
  imports: [],
  controllers: [],
  providers: [GraphService],
  exports: [GraphService],
})
export class GraphModule {}
