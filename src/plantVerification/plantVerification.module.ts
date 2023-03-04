import { Module } from "@nestjs/common";

import { PlantVerificationService } from "./plantVerification.service";
import { PlantVerificationController } from "./plantVerification.controller";

import { AuthModule } from "src/auth/auth.module";
import { Web3Module } from "src/web3/web3.module";

import { UserModule } from "src/user/user.module";
import { PlantModule } from "src/plant/plant.module";
import { TreeFactoryListener } from "./event/TreeFactoryListener.event";
import { MongooseModule } from "@nestjs/mongoose";
import { LastState, LastStateSchema } from "./schemas";
import { LastStateRepository } from "./plantVerification.repository";

@Module({
  imports: [
    PlantModule,
    AuthModule,
    UserModule,
    Web3Module,
    MongooseModule.forFeature([
      { name: LastState.name, schema: LastStateSchema },
    ]),
  ],
  controllers: [PlantVerificationController],
  providers: [
    PlantVerificationService,
    TreeFactoryListener,
    LastStateRepository,
  ],
  exports: [PlantVerificationService],
})
export class PlantVerificationModule {
  constructor(private treeFactoryListener: TreeFactoryListener) {}

  async configure() {
    await this.treeFactoryListener.configure();
  }
}
