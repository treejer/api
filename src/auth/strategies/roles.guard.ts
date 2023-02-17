import { Injectable, CanActivate, ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Observable } from "rxjs";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.get<string[]>("roles", context.getHandler());
    console.log("roles", roles);
    // if (!roles) {
    //   return true;
    // }
    const request = context.switchToHttp().getRequest();
    console.log("reqqqqq", request.user);

    // const user = request.user;
    // return matchRoles(roles, user.roles);

    return true;
  }
}
