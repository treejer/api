import { Injectable } from "@nestjs/common";
import { UserService } from "./user.service";
import { Command, Option } from "nestjs-command";
import { Role } from "src/common/constants";

@Injectable()
export class UserCommand {
  constructor(private readonly userService: UserService) {}

  @Command({
    command: "add:role",
    describe: "add role for user",
  })
  async addRole(
    @Option({
      name: "wallet",
      describe: "the wallet address",
      type: "string",
      required: false,
    })
    wallet: string,

    @Option({
      name: "role",
      describe: "the role",
      type: "number",
      required: false,
    })
    role: number,
  ) {
    this.userService.updateRole(wallet, role);
  }
}
