import {
  Controller,
  Body,
  Post,
  Delete,
  Param,
  Patch,
  UseGuards,
  HttpCode,
  Get,
} from "@nestjs/common";

import {
  AuthErrorMessages,
  PlantErrorMessage,
  PlantStatus,
  Role,
  SwaggerErrors,
} from "src/common/constants";
import { User } from "src/user/decorators";
import { JwtUserDto } from "src/auth/dtos";
import { HasRoles } from "src/auth/decorators";
import { RolesGuard } from "src/auth/strategies";
import { PlantService } from "./plant.service";
import { AuthGuard } from "@nestjs/passport";

import {
  CreateAssignedRequestDto,
  CreateUpdateRequestDto,
  EditAssignedRequestDto,
  EditUpdateRequestDto,
  PlantRequestDto,
  PlantRequestResultDto,
  AssignedRequestResultDto,
  UpdateRequestResultDto,
} from "./dtos";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";

@Controller()
@ApiTags("plant")
export class PlantController {
  constructor(private plantService: PlantService) {}

  @ApiBearerAuth()
  @ApiOperation({ summary: "create plant request." })
  @ApiResponse({
    status: 201,
    description: "plant request has been successfully created.",
    type: PlantRequestResultDto,
  })
  @ApiResponse({
    status: 400,
    description: SwaggerErrors.INVALID_INPUT_DESCRIPTION,
    content: {
      "text/plain": {
        schema: { format: "text/plain", example: SwaggerErrors.INVALID_INPUT },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: SwaggerErrors.UNAUTHORIZED_DESCRIPTION,
    content: {
      "text/plain": {
        schema: { format: "text/plain", example: SwaggerErrors.UNAUTHORIZED },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: "Response for Invalid access or supply error.",
    content: {
      "text/plain": {
        schema: {
          format: "text/plain",
          example: [
            AuthErrorMessages.INVALID_SIGNER,
            PlantErrorMessage.INVALID_PLANTER,
            PlantErrorMessage.SUPPLY_ERROR,
          ],
        },
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: SwaggerErrors.INTERNAL_SERVER_ERROR_DESCRIPTION,
    content: {
      "text/plain": {
        schema: {
          format: "text/plain",
          example: SwaggerErrors.INTERNAL_SERVER_ERROR,
        },
      },
    },
  })
  @HasRoles(Role.PLANTER)
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Post("plant_requests")
  plant(@Body() dto: PlantRequestDto, @User() user: JwtUserDto) {
    return this.plantService.plant(dto, user);
  }
  //------------------------------------------ ************************ ------------------------------------------//
  @ApiBearerAuth()
  @ApiOperation({ summary: "edit plant request" })
  @ApiResponse({
    status: 200,
    description: "plant request has been successfully edited.",
    type: PlantRequestResultDto,
  })
  @ApiResponse({
    status: 400,
    description: SwaggerErrors.INVALID_INPUT_DESCRIPTION,
    content: {
      "text/plain": {
        schema: { format: "text/plain", example: SwaggerErrors.INVALID_INPUT },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: SwaggerErrors.UNAUTHORIZED_DESCRIPTION,
    content: {
      "text/plain": {
        schema: { format: "text/plain", example: SwaggerErrors.UNAUTHORIZED },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: "Response for invalid access or invalid signer.",
    content: {
      "text/plain": {
        schema: {
          format: "text/plain",
          example: [
            AuthErrorMessages.INVALID_ACCESS,
            AuthErrorMessages.INVALID_SIGNER,
          ],
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: "plant request not exist",
    content: {
      "text/plain": {
        schema: {
          format: "text/plain",
          example: PlantErrorMessage.PLANT_DATA_NOT_EXIST,
        },
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: "Response for invalid status.",
    content: {
      "text/plain": {
        schema: {
          format: "text/plain",
          example: PlantErrorMessage.INVLID_STATUS,
        },
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: SwaggerErrors.INTERNAL_SERVER_ERROR_DESCRIPTION,
    content: {
      "text/plain": {
        schema: {
          format: "text/plain",
          example: SwaggerErrors.INTERNAL_SERVER_ERROR,
        },
      },
    },
  })
  @HasRoles(Role.PLANTER)
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Patch("plant_requests/:id")
  editPlant(
    @Param("id") id: string,
    @Body() dto: PlantRequestDto,
    @User() user: JwtUserDto
  ) {
    return this.plantService.editPlant(id, dto, user);
  }
  //------------------------------------------ ************************ ------------------------------------------//
  @ApiBearerAuth()
  @ApiOperation({ summary: "delete plant request." })
  @ApiResponse({
    status: 204,
    description: "plant request has been successfully deleted.",
  })
  @ApiResponse({
    status: 401,
    description: SwaggerErrors.UNAUTHORIZED_DESCRIPTION,
    content: {
      "text/plain": {
        schema: { format: "text/plain", example: SwaggerErrors.UNAUTHORIZED },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: "Response for invalid access",
    content: {
      "text/plain": {
        schema: {
          format: "text/plain",
          example: AuthErrorMessages.INVALID_ACCESS,
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: "plant request not exist",
    content: {
      "text/plain": {
        schema: {
          format: "text/plain",
          example: PlantErrorMessage.PLANT_DATA_NOT_EXIST,
        },
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: "Response for invalid status.",
    content: {
      "text/plain": {
        schema: {
          format: "text/plain",
          example: PlantErrorMessage.INVLID_STATUS,
        },
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: SwaggerErrors.INTERNAL_SERVER_ERROR_DESCRIPTION,
    content: {
      "text/plain": {
        schema: {
          format: "text/plain",
          example: SwaggerErrors.INTERNAL_SERVER_ERROR,
        },
      },
    },
  })
  @HttpCode(204)
  @HasRoles(Role.PLANTER)
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Delete("plant_requests/:id")
  deletePlant(@Param("id") id: string, @User() user: JwtUserDto) {
    return this.plantService.deletePlant(id, user);
  }
  //------------------------------------------ ************************ ------------------------------------------//
  @ApiBearerAuth()
  @ApiOperation({ summary: "get plant requests." })
  @ApiResponse({
    status: 200,
    description: "get plant requests for verification",
    isArray: true,
    type: PlantRequestResultDto,
  })
  @ApiResponse({
    status: 401,
    description: SwaggerErrors.UNAUTHORIZED_DESCRIPTION,
    content: {
      "text/plain": {
        schema: { format: "text/plain", example: SwaggerErrors.UNAUTHORIZED },
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: SwaggerErrors.INTERNAL_SERVER_ERROR_DESCRIPTION,
    content: {
      "text/plain": {
        schema: {
          format: "text/plain",
          example: SwaggerErrors.INTERNAL_SERVER_ERROR,
        },
      },
    },
  })
  @HasRoles(Role.ADMIN)
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Get("plant_requests/verification")
  getPlantRequests() {
    return this.plantService.getPlantRequests(
      { status: PlantStatus.PENDING },
      { signer: 1, nonce: 1 },
      {}
    );
  }
  //------------------------------------------ ************************ ------------------------------------------//
  @ApiBearerAuth()
  @ApiOperation({ summary: "create assigned request." })
  @ApiResponse({
    status: 201,
    description: "assigned request has been successfully created.",
    type: AssignedRequestResultDto,
  })
  @ApiResponse({
    status: 400,
    description: SwaggerErrors.INVALID_INPUT_DESCRIPTION,
    content: {
      "text/plain": {
        schema: { format: "text/plain", example: SwaggerErrors.INVALID_INPUT },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: SwaggerErrors.UNAUTHORIZED_DESCRIPTION,
    content: {
      "text/plain": {
        schema: { format: "text/plain", example: SwaggerErrors.UNAUTHORIZED },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: "Response for Invalid access/status or supply error.",
    content: {
      "text/plain": {
        schema: {
          format: "text/plain",
          example: [
            AuthErrorMessages.INVALID_SIGNER,
            PlantErrorMessage.INVALID_TREE_STATUS,
            PlantErrorMessage.INVALID_PLANTER_STATUS,
            PlantErrorMessage.INVALID_PLANTER,
            PlantErrorMessage.SUPPLY_ERROR,
          ],
        },
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: "Response for pending planted trees.",
    content: {
      "text/plain": {
        schema: {
          format: "text/plain",
          example: PlantErrorMessage.PENDING_ASSIGNED_PLANT,
        },
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: SwaggerErrors.INTERNAL_SERVER_ERROR_DESCRIPTION,
    content: {
      "text/plain": {
        schema: {
          format: "text/plain",
          example: SwaggerErrors.INTERNAL_SERVER_ERROR,
        },
      },
    },
  })
  @HasRoles(Role.PLANTER)
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Post("assigned_requests")
  plantAssignedTree(
    @Body() dto: CreateAssignedRequestDto,
    @User() user: JwtUserDto
  ) {
    return this.plantService.plantAssignedTree(dto, user);
  }
  //------------------------------------------ ************************ ------------------------------------------//
  @ApiBearerAuth()
  @ApiOperation({ summary: "edit assigned request" })
  @ApiResponse({
    status: 200,
    description: "assigned request has been successfully edited.",
    type: AssignedRequestResultDto,
  })
  @ApiResponse({
    status: 400,
    description: SwaggerErrors.INVALID_INPUT_DESCRIPTION,
    content: {
      "text/plain": {
        schema: { format: "text/plain", example: SwaggerErrors.INVALID_INPUT },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: SwaggerErrors.UNAUTHORIZED_DESCRIPTION,
    content: {
      "text/plain": {
        schema: { format: "text/plain", example: SwaggerErrors.UNAUTHORIZED },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: "Response for invalid access or invalid signer.",
    content: {
      "text/plain": {
        schema: {
          format: "text/plain",
          example: [
            AuthErrorMessages.INVALID_ACCESS,
            AuthErrorMessages.INVALID_SIGNER,
          ],
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: "assigned tree request not exist",
    content: {
      "text/plain": {
        schema: {
          format: "text/plain",
          example: PlantErrorMessage.ASSIGNED_TREE_DATA_NOT_EXIST,
        },
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: "Response for invalid status.",
    content: {
      "text/plain": {
        schema: {
          format: "text/plain",
          example: PlantErrorMessage.INVLID_STATUS,
        },
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: SwaggerErrors.INTERNAL_SERVER_ERROR_DESCRIPTION,
    content: {
      "text/plain": {
        schema: {
          format: "text/plain",
          example: SwaggerErrors.INTERNAL_SERVER_ERROR,
        },
      },
    },
  })
  @HasRoles(Role.PLANTER)
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Patch("assigned_requests/:id")
  editAssignedTree(
    @Param("id") id: string,
    @Body() dto: EditAssignedRequestDto,
    @User() user: JwtUserDto
  ) {
    return this.plantService.editAssignedTree(id, dto, user);
  }
  //------------------------------------------ ************************ ------------------------------------------//
  @ApiBearerAuth()
  @ApiOperation({ summary: "delete assigned request." })
  @ApiResponse({
    status: 204,
    description: "assigned request has been successfully deleted.",
  })
  @ApiResponse({
    status: 401,
    description: SwaggerErrors.UNAUTHORIZED_DESCRIPTION,
    content: {
      "text/plain": {
        schema: { format: "text/plain", example: SwaggerErrors.UNAUTHORIZED },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: "Response for invalid access",
    content: {
      "text/plain": {
        schema: {
          format: "text/plain",
          example: AuthErrorMessages.INVALID_ACCESS,
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: "assigned plant request not exist",
    content: {
      "text/plain": {
        schema: {
          format: "text/plain",
          example: PlantErrorMessage.ASSIGNED_TREE_DATA_NOT_EXIST,
        },
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: "Response for invalid status.",
    content: {
      "text/plain": {
        schema: {
          format: "text/plain",
          example: PlantErrorMessage.INVLID_STATUS,
        },
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: SwaggerErrors.INTERNAL_SERVER_ERROR_DESCRIPTION,
    content: {
      "text/plain": {
        schema: {
          format: "text/plain",
          example: SwaggerErrors.INTERNAL_SERVER_ERROR,
        },
      },
    },
  })
  @HttpCode(204)
  @HasRoles(Role.PLANTER)
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Delete("assigned_requests/:id")
  deleteAssignedTree(@Param("id") id: string, @User() user: JwtUserDto) {
    return this.plantService.deleteAssignedTree(id, user);
  }
  //------------------------------------------ ************************ ------------------------------------------//
  @ApiBearerAuth()
  @ApiOperation({ summary: "get assigned requests." })
  @ApiResponse({
    status: 200,
    description: "get assigned requests for verification",
    isArray: true,
    type: AssignedRequestResultDto,
  })
  @ApiResponse({
    status: 401,
    description: SwaggerErrors.UNAUTHORIZED_DESCRIPTION,
    content: {
      "text/plain": {
        schema: { format: "text/plain", example: SwaggerErrors.UNAUTHORIZED },
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: SwaggerErrors.INTERNAL_SERVER_ERROR_DESCRIPTION,
    content: {
      "text/plain": {
        schema: {
          format: "text/plain",
          example: SwaggerErrors.INTERNAL_SERVER_ERROR,
        },
      },
    },
  })
  @HasRoles(Role.ADMIN)
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Get("assigned_requests/verification")
  getAssignedTreeRequests() {
    return this.plantService.getAssignedTreeRequests(
      { status: PlantStatus.PENDING },
      { signer: 1, nonce: 1 },
      {}
    );
  }
  //------------------------------------------ ************************ ------------------------------------------//
  @ApiBearerAuth()
  @ApiOperation({ summary: "create update request." })
  @ApiResponse({
    status: 201,
    description: "update request has been successfully created.",
    type: UpdateRequestResultDto,
  })
  @ApiResponse({
    status: 400,
    description: SwaggerErrors.INVALID_INPUT_DESCRIPTION,
    content: {
      "text/plain": {
        schema: { format: "text/plain", example: SwaggerErrors.INVALID_INPUT },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: SwaggerErrors.UNAUTHORIZED_DESCRIPTION,
    content: {
      "text/plain": {
        schema: { format: "text/plain", example: SwaggerErrors.UNAUTHORIZED },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: "Response for Invalid access/status or early update.",
    content: {
      "text/plain": {
        schema: {
          format: "text/plain",
          example: [
            AuthErrorMessages.INVALID_SIGNER,
            PlantErrorMessage.INVALID_TREE_STATUS,
            PlantErrorMessage.INVALID_PLANTER,
            PlantErrorMessage.EARLY_UPDATE,
          ],
        },
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: "Response for pending update.",
    content: {
      "text/plain": {
        schema: {
          format: "text/plain",
          example: PlantErrorMessage.PENDING_UPDATE,
        },
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: SwaggerErrors.INTERNAL_SERVER_ERROR_DESCRIPTION,
    content: {
      "text/plain": {
        schema: {
          format: "text/plain",
          example: SwaggerErrors.INTERNAL_SERVER_ERROR,
        },
      },
    },
  })
  @HasRoles(Role.PLANTER)
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Post("update_requests")
  updateTree(@Body() body: CreateUpdateRequestDto, @User() user: JwtUserDto) {
    return this.plantService.updateTree(body, user);
  }
  //------------------------------------------ ************************ ------------------------------------------//
  @ApiBearerAuth()
  @ApiOperation({ summary: "edit update request" })
  @ApiResponse({
    status: 200,
    description: "update request has been successfully edited.",
    type: UpdateRequestResultDto,
  })
  @ApiResponse({
    status: 400,
    description: SwaggerErrors.INVALID_INPUT_DESCRIPTION,
    content: {
      "text/plain": {
        schema: { format: "text/plain", example: SwaggerErrors.INVALID_INPUT },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: SwaggerErrors.UNAUTHORIZED_DESCRIPTION,
    content: {
      "text/plain": {
        schema: { format: "text/plain", example: SwaggerErrors.UNAUTHORIZED },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: "Response for invalid access or invalid signer.",
    content: {
      "text/plain": {
        schema: {
          format: "text/plain",
          example: [
            AuthErrorMessages.INVALID_ACCESS,
            AuthErrorMessages.INVALID_SIGNER,
          ],
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: "update request not exist",
    content: {
      "text/plain": {
        schema: {
          format: "text/plain",
          example: PlantErrorMessage.UPDATE_DATA_NOT_EXIST,
        },
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: "Response for invalid status.",
    content: {
      "text/plain": {
        schema: {
          format: "text/plain",
          example: PlantErrorMessage.INVLID_STATUS,
        },
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: SwaggerErrors.INTERNAL_SERVER_ERROR_DESCRIPTION,
    content: {
      "text/plain": {
        schema: {
          format: "text/plain",
          example: SwaggerErrors.INTERNAL_SERVER_ERROR,
        },
      },
    },
  })
  @HasRoles(Role.PLANTER)
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Patch("update_requests/:id")
  editUpdateTree(
    @Param("id") id: string,
    @Body() body: EditUpdateRequestDto,
    @User() user: JwtUserDto
  ) {
    return this.plantService.editUpdateTree(id, body, user);
  }
  //------------------------------------------ ************************ ------------------------------------------//
  @ApiBearerAuth()
  @ApiOperation({ summary: "delete update request." })
  @ApiResponse({
    status: 204,
    description: "update request has been successfully deleted.",
  })
  @ApiResponse({
    status: 401,
    description: SwaggerErrors.UNAUTHORIZED_DESCRIPTION,
    content: {
      "text/plain": {
        schema: { format: "text/plain", example: SwaggerErrors.UNAUTHORIZED },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: "Response for invalid access",
    content: {
      "text/plain": {
        schema: {
          format: "text/plain",
          example: AuthErrorMessages.INVALID_ACCESS,
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: "update request not exist",
    content: {
      "text/plain": {
        schema: {
          format: "text/plain",
          example: PlantErrorMessage.UPDATE_DATA_NOT_EXIST,
        },
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: "Response for invalid status.",
    content: {
      "text/plain": {
        schema: {
          format: "text/plain",
          example: PlantErrorMessage.INVLID_STATUS,
        },
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: SwaggerErrors.INTERNAL_SERVER_ERROR_DESCRIPTION,
    content: {
      "text/plain": {
        schema: {
          format: "text/plain",
          example: SwaggerErrors.INTERNAL_SERVER_ERROR,
        },
      },
    },
  })
  @HttpCode(204)
  @HasRoles(Role.PLANTER)
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Delete("update_requests/:id")
  deleteUpdateTree(@Param("id") id: string, @User() user: JwtUserDto) {
    return this.plantService.deleteUpdateTree(id, user);
  }
  //------------------------------------------ ************************ ------------------------------------------//
  @ApiBearerAuth()
  @ApiOperation({ summary: "get update requests." })
  @ApiResponse({
    status: 200,
    description: "get update requests for verification",
    isArray: true,
    type: UpdateRequestResultDto,
  })
  @ApiResponse({
    status: 401,
    description: SwaggerErrors.UNAUTHORIZED_DESCRIPTION,
    content: {
      "text/plain": {
        schema: { format: "text/plain", example: SwaggerErrors.UNAUTHORIZED },
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: SwaggerErrors.INTERNAL_SERVER_ERROR_DESCRIPTION,
    content: {
      "text/plain": {
        schema: {
          format: "text/plain",
          example: SwaggerErrors.INTERNAL_SERVER_ERROR,
        },
      },
    },
  })
  @HasRoles(Role.ADMIN)
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Get("update_requests/verification")
  getUpdateRequests() {
    return this.plantService.getUpdateTreeRequests(
      { status: PlantStatus.PENDING },
      { signer: 1, nonce: 1 },
      {}
    );
  }
}
