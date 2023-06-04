import { Module } from "@nestjs/common";
import { PlantController } from "./plant.controller";
import { PlantService } from "./plant.service";
import {
  AssignedTreePlant,
  AssignedTreePlantSchema,
  TreePlant,
  TreePlantSchema,
  UpdateTree,
  UpdateTreeSchema,
} from "./schemas";

import {
  AssignedTreePlantRepository,
  UpdateTreeRepository,
  TreePlantRepository,
} from "./plant.repository";

import { MongooseModule } from "@nestjs/mongoose";
import { UserModule } from "src/user/user.module";
import { AuthModule } from "src/auth/auth.module";
import { Web3Module } from "src/web3/web3.module";
import { DatabaseModule } from "src/database/database.module";
import { GraphModule } from "src/graph/graph.module";

@Module({
  imports: [
    UserModule,
    AuthModule,
    GraphModule,
    Web3Module,
    DatabaseModule,
    MongooseModule.forFeature([
      { name: AssignedTreePlant.name, schema: AssignedTreePlantSchema },
    ]),
    MongooseModule.forFeature([
      { name: TreePlant.name, schema: TreePlantSchema },
    ]),

    MongooseModule.forFeature([
      { name: UpdateTree.name, schema: UpdateTreeSchema },
    ]),
  ],
  controllers: [PlantController],
  providers: [
    PlantService,
    AssignedTreePlantRepository,
    UpdateTreeRepository,
    TreePlantRepository,
  ],
  exports: [PlantService],
})
export class PlantModule {}
