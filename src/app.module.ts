import { Web3Module } from "./web3/web3.module";
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AuthModule } from "./auth/auth.module";
import { DatabaseModule } from "./database/database.module";
import { UserModule } from "./user/user.module";
import { PlantModule } from "./plant/plant.module";
import { PlantVerificationModule } from "./plantVerification/plantVerification.module";
import { ConfigService } from "@nestjs/config";

@Module({
  imports: [
    Web3Module,
    PlantVerificationModule,
    DatabaseModule,
    UserModule,
    AuthModule,
    PlantModule,
    ConfigModule.forRoot({ isGlobal: true }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
