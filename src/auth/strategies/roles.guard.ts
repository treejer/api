import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Observable } from "rxjs";
import { AuthErrorMessages } from "src/common/constants";
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

    throw new UnauthorizedException(AuthErrorMessages.INVALID_ROLE);
  }
}
