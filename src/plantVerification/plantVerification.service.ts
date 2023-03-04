import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import { PlantErrorMessage, PlantStatus } from "src/common/constants";
import { PlantService } from "src/plant/plant.service";
import { LastStateRepository } from "./plantVerification.repository";
import { EditResult, CreateResult } from "./interfaces";

@Injectable()
export class PlantVerificationService {
  constructor(
    private plantService: PlantService,
    private lastStateRepository: LastStateRepository,
  ) {}

  async verifyPlant(signer: string, nonce: number) {
    console.log("verifyPlant treeId", signer, nonce);

    const plantData = await this.plantService.getPlantData({
      signer,
      nonce,
      status: PlantStatus.PENDING,
    });

    if (!plantData)
      throw new NotFoundException(PlantErrorMessage.PLANT_DATA_NOT_EXIST);

    return await this.plantService.editPlantDataStatus(
      { signer, nonce },
      PlantStatus.VERIFIED,
    );
  }
  async verifyAssignedTree(treeId: number) {
    console.log("verifyAssignedTree treeId", treeId);

    const assignedPlantData = await this.plantService.getAssignedTreeData({
      treeId,
      status: PlantStatus.PENDING,
    });
    if (!assignedPlantData)
      throw new NotFoundException(
        PlantErrorMessage.ASSIGNED_TREE_DATA_NOT_EXIST,
      );

    return await this.plantService.editAssignedTreeDataStatus(
      { treeId, status: PlantStatus.PENDING },
      PlantStatus.VERIFIED,
    );
  }

  async verifyUpdate(treeId: number) {
    console.log("verifyUpdate treeId", treeId);

    const updateData = await this.plantService.getUpdateTreeData({
      treeId,
      status: PlantStatus.PENDING,
    });
    if (!updateData)
      throw new NotFoundException(PlantErrorMessage.UPDATE_DATA_NOT_EXIST);

    return await this.plantService.editUpdateTreeDataStatus(
      { treeId, status: PlantStatus.PENDING },
      PlantStatus.VERIFIED,
    );
  }

  async rejectPlant(recordId: string) {
    const plantData = await this.plantService.getPlantData({
      _id: recordId,
    });

    if (!plantData)
      throw new NotFoundException(PlantErrorMessage.PLANT_DATA_NOT_EXIST);

    if (plantData.status != PlantStatus.PENDING)
      throw new ConflictException(PlantErrorMessage.INVLID_STATUS);

    return await this.plantService.editPlantDataStatus(
      { _id: recordId },
      PlantStatus.REJECTED,
    );
  }

  async getPlantRequests() {
    return this.plantService.getPlantRequests(
      { status: PlantStatus.PENDING },
      { signer: 1, nonce: 1 },
      {},
    );
  }

  async rejectAssignedTree(recordId: string) {
    const assignedPlantData = await this.plantService.getAssignedTreeData({
      _id: recordId,
    });
    if (!assignedPlantData)
      throw new NotFoundException(
        PlantErrorMessage.ASSIGNED_TREE_DATA_NOT_EXIST,
      );

    if (assignedPlantData.status != PlantStatus.PENDING)
      throw new ConflictException(PlantErrorMessage.INVLID_STATUS);

    return await this.plantService.editAssignedTreeDataStatus(
      { _id: recordId },
      PlantStatus.REJECTED,
    );
  }
  async getAssignedTreeRequests() {
    return this.plantService.getAssignedTreeRequests(
      { status: PlantStatus.PENDING },
      { signer: 1, nonce: 1 },
      {},
    );
  }

  async rejectUpdate(recordId: string) {
    const updateData = await this.plantService.getUpdateTreeData({
      _id: recordId,
    });
    if (!updateData)
      throw new NotFoundException(PlantErrorMessage.UPDATE_DATA_NOT_EXIST);
    if (updateData.status != PlantStatus.PENDING)
      throw new ConflictException(PlantErrorMessage.INVLID_STATUS);

    return await this.plantService.editUpdateTreeDataStatus(
      { _id: recordId },
      PlantStatus.REJECTED,
    );
  }
  async getUpdateRequests() {
    return this.plantService.getUpdateTreeRequests(
      { status: PlantStatus.PENDING },
      { signer: 1, nonce: 1 },
      {},
    );
  }

  async saveLastState(
    lastBlockNumber: number,
  ): Promise<EditResult | CreateResult> {
    let lastState = await this.lastStateRepository.findOne({});
    let result;

    if (!lastState) {
      result = await this.lastStateRepository.create({ lastBlockNumber });

      result = { recordId: result._id };
    } else {
      result = await this.lastStateRepository.updateOne(
        {},
        { lastBlockNumber },
      );

      result = { acknowledged: result.acknowledged };
    }

    return result;
  }

  async loadLastState() {
    return await this.lastStateRepository.findOne({});
  }
}
