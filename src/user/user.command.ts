import { Injectable } from "@nestjs/common";
import { UserService } from "./user.service";
import { Command, Positional } from "nestjs-command";
import { Role } from "src/common/constants";

@Injectable()
export class UserCommand {
  constructor(private readonly userService: UserService) {}

  @Command({
    command: "add:role <wallet> <role>",
    describe: "add role for user",
  })
  async addRole(
    @Positional({
      name: "wallet",
      describe: "the wallet address",
      type: "string",
    })
    wallet: string,

    @Positional({
      name: "role",
      describe: "the role",
      type: "number",
    })
    role: Role
  ) {
    this.userService.updateRole(wallet, role);
  }
}
