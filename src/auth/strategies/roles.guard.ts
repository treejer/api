import { Injectable, CanActivate, ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Observable } from "rxjs";
import { UserService } from "../../user/user.service";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector, private userService: UserService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const roles = this.reflector.get<string[]>("roles", context.getHandler());

    const request = context.switchToHttp().getRequest();

    const user = await this.userService.findUserById(request.user.userId);

    if (roles.includes(user.userRole)) {
      return true;
    }

    return false;
  }
}
