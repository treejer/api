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
import { AuthModule } from "../auth/auth.module";
import { Web3Module } from "src/web3/web3.module";

@Module({
  imports: [
    UserModule,
    AuthModule,
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
