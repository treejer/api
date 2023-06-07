import { Module } from "@nestjs/common";
import { PlantModule } from "src/plant/plant.module";
import { GraphController } from "./graph.controller";
import { GraphService } from "./graph.service";

@Module({
  imports: [PlantModule],
  controllers: [GraphController],
  providers: [GraphService],
  exports: [GraphService],
})
export class GraphModule {}
