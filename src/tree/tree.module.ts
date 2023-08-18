import { Module } from "@nestjs/common";
import { PlantModule } from "src/plant/plant.module";
import { TreeController } from "./tree.controller";
import { TreeService } from "./tree.service";

@Module({
  controllers: [TreeController],
  providers: [TreeService],
  imports: [PlantModule],
  exports: [TreeService],
})
export class TreeModule {}
