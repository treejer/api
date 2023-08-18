import { SetMetadata } from "@nestjs/common";
import { Role } from "../../common/constants";

export const HasRoles = (...roles: Role[]) => SetMetadata("roles", roles);
