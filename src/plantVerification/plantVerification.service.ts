import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import { PlantErrorMessage, PlantStatus } from "src/common/constants";
import { PlantService } from "src/plant/plant.service";
import { LastStateRepository } from "./plantVerification.repository";
import { EditResult, CreateResult } from "./interfaces";
import {
  AssignedRequestStatusEditResultDto,
  PlantRequestStatusEditResultDto,
  UpdateRequestStatusEditResultDto,
} from "src/plant/dtos";

@Injectable()
export class PlantVerificationService {
  constructor(
    private plantService: PlantService,
    private lastStateRepository: LastStateRepository
  ) {}

  async verifyPlant(
    signer: string,
    nonce: number
  ): Promise<PlantRequestStatusEditResultDto> {
    const plantData = await this.plantService.getPlantData({
      signer,
      nonce,
      status: PlantStatus.PENDING,
    });

    if (!plantData)
      throw new NotFoundException(PlantErrorMessage.PLANT_DATA_NOT_EXIST);

    await this.plantService.editPlantDataStatus(
      { signer, nonce },
      PlantStatus.VERIFIED
    );

    return { _id: plantData._id, status: PlantStatus.VERIFIED };
  }
  async verifyAssignedTree(
    treeId: number
  ): Promise<AssignedRequestStatusEditResultDto> {
    const assignedPlantData = await this.plantService.getAssignedTreeData({
      treeId,
      status: PlantStatus.PENDING,
    });
    if (!assignedPlantData)
      throw new NotFoundException(
        PlantErrorMessage.ASSIGNED_TREE_DATA_NOT_EXIST
      );

    await this.plantService.editAssignedTreeDataStatus(
      { treeId, status: PlantStatus.PENDING },
      PlantStatus.VERIFIED
    );

    return { _id: assignedPlantData._id, status: PlantStatus.VERIFIED };
  }

  async verifyUpdate(
    treeId: number
  ): Promise<UpdateRequestStatusEditResultDto> {
    const updateData = await this.plantService.getUpdateTreeData({
      treeId,
      status: PlantStatus.PENDING,
    });
    if (!updateData)
      throw new NotFoundException(PlantErrorMessage.UPDATE_DATA_NOT_EXIST);

    await this.plantService.editUpdateTreeDataStatus(
      { treeId, status: PlantStatus.PENDING },
      PlantStatus.VERIFIED
    );

    return { _id: updateData._id, status: PlantStatus.VERIFIED };
  }

  async rejectPlant(
    recordId: string
  ): Promise<PlantRequestStatusEditResultDto> {
    const plantData = await this.plantService.getPlantData({
      _id: recordId,
    });

    if (!plantData)
      throw new NotFoundException(PlantErrorMessage.PLANT_DATA_NOT_EXIST);

    if (plantData.status != PlantStatus.PENDING)
      throw new ConflictException(PlantErrorMessage.INVLID_STATUS);

    await this.plantService.editPlantDataStatus(
      { _id: recordId },
      PlantStatus.REJECTED
    );

    return { _id: recordId, status: PlantStatus.REJECTED };
  }

  async rejectAssignedTree(
    recordId: string
  ): Promise<AssignedRequestStatusEditResultDto> {
    const assignedPlantData = await this.plantService.getAssignedTreeData({
      _id: recordId,
    });
    if (!assignedPlantData)
      throw new NotFoundException(
        PlantErrorMessage.ASSIGNED_TREE_DATA_NOT_EXIST
      );

    if (assignedPlantData.status != PlantStatus.PENDING)
      throw new ConflictException(PlantErrorMessage.INVLID_STATUS);

    await this.plantService.editAssignedTreeDataStatus(
      { _id: recordId },
      PlantStatus.REJECTED
    );

    return { _id: recordId, status: PlantStatus.REJECTED };
  }

  async rejectUpdate(
    recordId: string
  ): Promise<UpdateRequestStatusEditResultDto> {
    const updateData = await this.plantService.getUpdateTreeData({
      _id: recordId,
    });
    if (!updateData)
      throw new NotFoundException(PlantErrorMessage.UPDATE_DATA_NOT_EXIST);
    if (updateData.status != PlantStatus.PENDING)
      throw new ConflictException(PlantErrorMessage.INVLID_STATUS);

    await this.plantService.editUpdateTreeDataStatus(
      { _id: recordId },
      PlantStatus.REJECTED
    );

    return { _id: recordId, status: PlantStatus.REJECTED };
  }

  async saveLastState(
    lastBlockNumber: number
  ): Promise<EditResult | CreateResult> {
    let lastState = await this.lastStateRepository.findOne({}, { _id: 1 });
    let result;

    if (!lastState) {
      result = await this.lastStateRepository.create({
        lastBlockNumber,
      });

      result = { recordId: result._id };
    } else {
      result = await this.lastStateRepository.updateOne(
        { _id: lastState._id },
        { lastBlockNumber }
      );

      result = { acknowledged: result.acknowledged };
    }

    return result;
  }

  async loadLastState(): Promise<number> {
    let result = await this.lastStateRepository.findOne(
      {},
      { lastBlockNumber: 1, _id: 0 }
    );

    return result ? result.lastBlockNumber : 1;
  }
}
