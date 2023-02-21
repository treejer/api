import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { JwtUserDto } from "src/auth/dtos";

export const User = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
