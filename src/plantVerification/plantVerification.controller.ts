import { Controller, Param, Patch, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { HasRoles } from "src/auth/decorators";
import { RolesGuard } from "src/auth/strategies";
import { PlantErrorMessage, Role, SwaggerErrors } from "src/common/constants";
import {
  AssignedRequestStatusEditResultDto,
  PlantRequestStatusEditResultDto,
  UpdateRequestStatusEditResultDto,
} from "src/plant/dtos";

import { PlantVerificationService } from "./plantVerification.service";

@ApiTags("plantVerification")
@Controller()
export class PlantVerificationController {
  constructor(private plantVerificationService: PlantVerificationService) {}

  @ApiBearerAuth()
  @ApiOperation({ summary: "reject plant request" })
  @ApiResponse({
    status: 200,
    description: "plant request has been successfully rejected.",
    type: PlantRequestStatusEditResultDto,
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
    status: 404,
    description: "Response for not exist data",
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
    description: "Response for invalid status",
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
  @HasRoles(Role.ADMIN)
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Patch("plant_requests/:id/reject")
  rejectPlant(@Param("id") id: string) {
    return this.plantVerificationService.rejectPlant(id);
  }
  //------------------------------------------ ************************ ------------------------------------------//
  @ApiBearerAuth()
  @ApiOperation({ summary: "reject assigned request" })
  @ApiResponse({
    status: 200,
    description: "assigned request has been successfully rejected.",
    type: AssignedRequestStatusEditResultDto,
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
    status: 404,
    description: "Response for not exist data",
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
    description: "Response for invalid status",
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
  @HasRoles(Role.ADMIN)
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Patch("assigned_requests/:id/reject")
  rejectAssignedTree(@Param("id") id: string) {
    return this.plantVerificationService.rejectAssignedTree(id);
  }

  //------------------------------------------ ************************ ------------------------------------------//

  @ApiBearerAuth()
  @ApiOperation({ summary: "reject update request" })
  @ApiResponse({
    status: 200,
    description: "update request has been successfully rejected.",
    type: UpdateRequestStatusEditResultDto,
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
    status: 404,
    description: "Response for not exist data",
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
    description: "Response for invalid status",
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
        schema: { format: "text/plain", example: SwaggerErrors.UNAUTHORIZED },
      },
    },
  })
  @HasRoles(Role.ADMIN)
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Patch("update_requests/:id/reject")
  rejectUpdate(@Param("id") id: string) {
    return this.plantVerificationService.rejectUpdate(id);
  }
}
