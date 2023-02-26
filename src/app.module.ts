import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AuthModule } from "./auth/auth.module";
import { DatabaseModule } from "./database/database.module";
import { UserModule } from "./user/user.module";
import { PlantModule } from "./plant/plant.module";
import { PlantVerificationModule } from "./plantVerification/plantVerification.module";

@Module({
  imports: [
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
