import { Module } from "@nestjs/common";
import { TreeController } from "./tree.controller";
import { TreeService } from "./tree.service";

@Module({
  controllers: [TreeController],
  providers: [TreeService],
  imports: [],
  exports: [TreeService],
})
export class TreeModule {}
