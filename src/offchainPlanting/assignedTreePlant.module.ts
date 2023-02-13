import { Module } from "@nestjs/common";
import { AssignedTreePlantController } from "./assignedTreePlant.controller";
import { AssignedTreePlantService } from "./assignedTreePlant.service";
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
} from "./assignedTreePlant.repository";
import { DatabaseModule } from "../database/database.module";
import { MongooseModule } from "@nestjs/mongoose";
import { UserModule } from "../user/user.module";
import { TreePlantRepository } from "./treePlant.repository";

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
  controllers: [AssignedTreePlantController],
  providers: [
    AssignedTreePlantService,
    AssignedTreePlantRepository,
    UpdateTreeRepository,
    TreePlantRepository,
  ],
  exports: [AssignedTreePlantService],
})
export class AssignedTreePlantModule {}
