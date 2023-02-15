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
import { DatabaseModule } from "../database/database.module";
import { MongooseModule } from "@nestjs/mongoose";
import { UserModule } from "../user/user.module";

@Module({
  imports: [
    UserModule,
    MongooseModule.forFeature([
      { name: AssignedTreePlant.name, schema: AssignedTreePlantSchema },
    ]),
    MongooseModule.forFeature([
      { name: TreePlant.name, schema: TreePlantSchema },
    ]),

    MongooseModule.forFeature([
      { name: UpdateTree.name, schema: UpdateTreeSchema },
    ]),

    DatabaseModule,
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
