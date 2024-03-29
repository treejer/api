import { Module } from "@nestjs/common";
import { UserController } from "./user.controller";
import { UserService } from "./user.service";
import { User, UserSchema } from "./schemas";
import { UserRepository } from "./user.repository";
import { MongooseModule } from "@nestjs/mongoose";
import { DatabaseModule } from "src/database/database.module";
import { UserCommand } from "./user.command";
import { EmailModule } from "src/email/email.module";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    DatabaseModule,
    EmailModule,
  ],
  controllers: [UserController],
  providers: [UserService, UserCommand, UserRepository],
  exports: [UserService],
})
export class UserModule {}
