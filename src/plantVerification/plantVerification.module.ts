import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { DatabaseModule } from "../database/database.module";
import { AuthModule } from "../auth/auth.module";
import { PlantModule } from "../plant/plant.module";
import { PlantVerificationService } from "./plantVerification.service";
import { PlantVerificationController } from "./plantVerification.controller";
import { UserModule } from "../user/user.module";
import { TreeFactoryListener } from "./event/TreeFactoryListener.event";

@Module({
  imports: [PlantModule, AuthModule, UserModule],
  controllers: [PlantVerificationController],
  providers: [PlantVerificationService, TreeFactoryListener],
  exports: [PlantVerificationService],
})
export class PlantVerificationModule {}
