import { Controller, Get, Param, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";

import { UserService } from "./user.service";

@ApiTags("user")
@Controller("users")
export class UserController {
  constructor(private userService: UserService) {}
}
