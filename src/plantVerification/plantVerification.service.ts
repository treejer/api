import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PlantErrorMessage, PlantStatus } from "../common/constants";
import { PlantService } from "../plant/plant.service";
@Injectable()
export class PlantVerificationService {
  constructor(private plantService: PlantService) {}

  async rejectPlant(recordId: string) {
    const plantData = await this.plantService.getPlantDataWithId(recordId);

    if (!plantData)
      throw new NotFoundException(PlantErrorMessage.PLANT_DATA_NOT_EXIST);

    if (plantData.status != PlantStatus.PENDING)
      throw new ConflictException(PlantErrorMessage.INVLID_STATUS);

    return await this.plantService.editPlantDataStatus(
      recordId,
      PlantStatus.REJECTED,
    );
  }

  async getPlantRequests() {
    return this.plantService.getPlantRequests(
      { status: PlantStatus.PENDING },
      { walletAddress: 1, nonce: 1 },
      {},
    );
  }

  async rejectAssignedTree(recordId: string) {
    const assignedPlantData = await this.plantService.getAssignedTreeDataWithId(
      recordId,
    );
    if (!assignedPlantData)
      throw new NotFoundException(
        PlantErrorMessage.ASSIGNED_TREE_DATA_NOT_EXIST,
      );

    if (assignedPlantData.status != PlantStatus.PENDING)
      throw new ConflictException(PlantErrorMessage.INVLID_STATUS);

    return await this.plantService.editAssignedTreeDataStatus(
      recordId,
      PlantStatus.REJECTED,
    );
  }
  async getAssignedTreeRequests() {
    return this.plantService.getAssignedTreeRequests(
      { status: PlantStatus.PENDING },
      { walletAddress: 1, nonce: 1 },
      {},
    );
  }

  async rejectUpdate(recordId: string) {
    const updateData = await this.plantService.getUpdateTreeDataWithId(
      recordId,
    );
    if (!updateData)
      throw new NotFoundException(PlantErrorMessage.UPDATE_DATA_NOT_EXIST);
    if (updateData.status != PlantStatus.PENDING)
      throw new ConflictException(PlantErrorMessage.INVLID_STATUS);

    return await this.plantService.editUpdateTreeDataStatus(
      recordId,
      PlantStatus.REJECTED,
    );
  }
  async getUpdateRequests() {
    return this.plantService.getUpdateTreeRequests(
      { status: PlantStatus.PENDING },
      { walletAddress: 1, nonce: 1 },
      {},
    );
  }
}
