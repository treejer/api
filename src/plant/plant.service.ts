import {
  CreateAssignedTreePlantDto,
  CreateTreePlantDto,
  EditTreePlantDto,
  EditTreeAssignPlantDto,
  CreateUpdateTreeDto,
  EditUpdateTreeDto,
} from "./dtos";
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";

import { AssignedTreePlant, TreePlant } from "./schemas";
import {
  AssignedTreePlantRepository,
  UpdateTreeRepository,
  TreePlantRepository,
} from "./plant.repository";

import {
  getPlanterData,
  getPlanterOrganization,
  getTreeData,
} from "../common/helpers";

import { UserService } from "../user/user.service";
import { getSigner } from "../common/helpers/getSigner";
import {
  AuthErrorMessages,
  PlantErrorMessage,
  PlantStatus,
} from "../common/constants";
import { Types } from "mongoose";
import { JwtUserDto } from "../auth/dtos";

var ethUtil = require("ethereumjs-util");

@Injectable()
export class PlantService {
  constructor(
    private updateTreeRepository: UpdateTreeRepository,
    private assignedTreePlantRepository: AssignedTreePlantRepository,
    private treePlantRepository: TreePlantRepository,
    private userService: UserService
  ) {}

  async plant(dto: CreateTreePlantDto, user): Promise<string> {
    let userData = await this.userService.findUserById(user.userId);

    const signer = await getSigner(
      dto.signature,
      {
        nonce: userData.plantingNonce,
        treeSpecs: dto.treeSpecs,
        birthDate: dto.birthDate,
        countryCode: dto.countryCode,
      },
      2
    );

    if (
      ethUtil.toChecksumAddress(signer) !==
      ethUtil.toChecksumAddress(userData.walletAddress)
    )
      throw new BadRequestException(AuthErrorMessages.INVALID_SIGNER);

    const planterData = await getPlanterData(signer);

    if (planterData.status != 1)
      throw new ForbiddenException(PlantErrorMessage.INVALID_PLANTER);

    let count = await this.pendingListCount({
      signer,
      status: PlantStatus.PENDING,
    });

    if (planterData.plantedCount + count >= planterData.supplyCap)
      throw new ForbiddenException(PlantErrorMessage.SUPPLY_ERROR);

    await this.userService.updateUserById(userData._id, {
      plantingNonce: userData.plantingNonce + 1,
    });

    const createdData = await this.treePlantRepository.create({
      ...dto,
      signer,
      nonce: userData.plantingNonce,
    });
    return createdData._id;
  }

  async deletePlant(recordId: string, user): Promise<boolean> {
    const plantData = await this.treePlantRepository.findOne({
      _id: recordId,
    });

    if (!plantData)
      throw new NotFoundException(PlantErrorMessage.PLANT_DATA_NOT_EXIST);

    if (plantData.userId !== user.userId)
      throw new BadRequestException(AuthErrorMessages.INVALID_ACCESS);

    if (plantData.status !== PlantStatus.PENDING)
      throw new BadRequestException(PlantErrorMessage.INVLID_STATUS);

    const result = await this.treePlantRepository.softDeleteOne(
      {
        _id: recordId,
      },
      {
        status: PlantStatus.DELETE,
      }
    );

    return result.acknowledged;
  }

  async editPlant(
    recordId: string,
    dto: EditTreePlantDto,
    user
  ): Promise<boolean> {
    const plantData = await this.treePlantRepository.findOne({
      _id: recordId,
    });

    if (!plantData)
      throw new NotFoundException(PlantErrorMessage.PLANT_DATA_NOT_EXIST);

    if (plantData.userId != user.userId)
      throw new BadRequestException(AuthErrorMessages.INVALID_ACCESS);

    if (plantData.status !== PlantStatus.PENDING)
      throw new BadRequestException(PlantErrorMessage.INVLID_STATUS);

    let userData = await this.userService.findUserById(user.userId);

    const signer = await getSigner(
      dto.signature,
      {
        nonce: userData.plantingNonce,
        treeSpecs: dto.treeSpecs,
        birthDate: dto.birthDate,
        countryCode: dto.countryCode,
      },
      2
    );

    if (
      ethUtil.toChecksumAddress(signer) !==
      ethUtil.toChecksumAddress(userData.walletAddress)
    )
      throw new BadRequestException(AuthErrorMessages.INVALID_SIGNER);

    const result = await this.treePlantRepository.updateOne(
      { _id: recordId },
      { ...dto, nonce: userData.plantingNonce }
    );

    return result.acknowledged;
  }

  async plantAssignedTree(dto: CreateAssignedTreePlantDto, user) {
    const signer = await getSigner(
      dto.signature,
      {
        nonce: user.plantingNonce,
        treeId: dto.treeId,
        treeSpecs: dto.treeSpecs,
        birthDate: dto.birthDate,
        countryCode: dto.countryCode,
      },
      1
    );

    if (
      ethUtil.toChecksumAddress(signer) !==
      ethUtil.toChecksumAddress(dto.signer)
    )
      throw new BadRequestException(AuthErrorMessages.INVALID_SIGNER);

    let plantData = await this.assignedTreePlantRepository.findOne(
      {
        treeId: dto.treeId,
      },
      {
        projection: { _id: 1 },
      }
    );

    if (plantData && plantData.status == PlantStatus.PENDING)
      throw new ConflictException(PlantErrorMessage.PENDING_ASSIGNED_PLANT);

    let tree = await getTreeData(dto.treeId);

    if (tree.treeStatus != 2)
      throw new ForbiddenException(PlantErrorMessage.INVALID_TREE_STATUS);

    const planterData = await getPlanterData(signer);

    if (planterData.status != 1)
      throw new ForbiddenException(PlantErrorMessage.INVALID_PLANTER);

    if (
      ethUtil.toChecksumAddress(tree.planter) !==
      ethUtil.toChecksumAddress(signer)
    ) {
      if (
        !(
          planterData.planterType == 3 &&
          tree.planter == (await getPlanterOrganization(signer))
        )
      )
        throw new ForbiddenException(PlantErrorMessage.INVALID_PLANTER);
    }

    let pendingPlantsCount: number = await this.pendingListCount({
      signer: dto.signer,
      status: PlantStatus.PENDING,
    });

    if (planterData.plantedCount + pendingPlantsCount >= planterData.supplyCap)
      throw new ForbiddenException(PlantErrorMessage.SUPPLY_ERROR);

    const assignedPlant = await this.assignedTreePlantRepository.create({
      ...dto,
      nonce: user.plantingNonce,
      userId: user._id,
    });

    await this.userService.updateUserById(user._id, {
      plantingNonce: user.plantingNonce + 1,
    });

    return assignedPlant._id;
  }

  async editAssignedTree(treeId: string, data: EditTreeAssignPlantDto, user) {
    const assignedPlantData = await this.assignedTreePlantRepository.findOne({
      treeId,
    });

    if (!assignedPlantData)
      throw new NotFoundException(PlantErrorMessage.INVALID_TREE_ID);

    if (assignedPlantData.userId != user.userId)
      throw new ForbiddenException(AuthErrorMessages.INVALID_ACCESS);

    if (assignedPlantData.status != PlantStatus.PENDING)
      throw new ConflictException(PlantErrorMessage.INVLID_STATUS);

    let userData = await this.userService.findUserById(user.userId);

    const signer = await getSigner(
      data.signature,
      {
        nonce: user.plantingNonce,
        treeId: treeId,
        treeSpecs: data.treeSpecs,
        birthDate: data.birthDate,
        countryCode: data.countryCode,
      },
      1
    );

    if (
      ethUtil.toChecksumAddress(signer) !==
      ethUtil.toChecksumAddress(userData.walletAddress)
    )
      throw new ForbiddenException(AuthErrorMessages.INVALID_SIGNER);

    await this.assignedTreePlantRepository.updateOne(
      {
        treeId,
        status: PlantStatus.PENDING,
      },
      {
        ...data,
        nonce: userData.plantingNonce,
      }
    );

    await this.userService.updateUserById(user._id, {
      plantingNonce: user.plantingNonce + 1,
    });
  }

  async deleteAssignedTree(treeId: string, user) {
    const assignedPlantData = await this.assignedTreePlantRepository.findOne({
      treeId,
    });

    if (!assignedPlantData)
      throw new NotFoundException(PlantErrorMessage.INVALID_TREE_ID);

    if (assignedPlantData.userId !== user.userId)
      throw new ForbiddenException(AuthErrorMessages.INVALID_ACCESS);

    if (assignedPlantData.status !== PlantStatus.PENDING)
      throw new ConflictException(PlantErrorMessage.INVLID_STATUS);

    await this.assignedTreePlantRepository.softDeleteOne(
      {
        treeId,
        status: PlantStatus.PENDING,
      },
      {
        status: PlantStatus.DELETE,
      }
    );
  }

  async updateTree(dto: CreateUpdateTreeDto, user): Promise<string> {
    let userData = await this.userService.findUserById(user.userId);

    const signer = await getSigner(
      dto.signature,
      {
        nonce: userData.plantingNonce,
        treeId: dto.treeId,
        treeSpecs: dto.treeSpecs,
      },
      3
    );

    if (
      ethUtil.toChecksumAddress(signer) !==
      ethUtil.toChecksumAddress(userData.walletAddress)
    )
      throw new BadRequestException(AuthErrorMessages.INVALID_SIGNER);

    let tree = await getTreeData(dto.treeId);

    if (tree.treeStatus < 4)
      throw new ForbiddenException(PlantErrorMessage.INVALID_TREE_STATUS);

    if (
      ethUtil.toChecksumAddress(tree.planter) !==
      ethUtil.toChecksumAddress(signer)
    )
      throw new ForbiddenException(PlantErrorMessage.INVALID_PLANTER);

    if (
      Math.floor(new Date().getTime() / 1000) <
      tree.plantDate + tree.treeStatus * 3600 + 604800
    )
      throw new ForbiddenException(PlantErrorMessage.EARLY_UPDATE);

    let pendingUpdates = await this.updateTreeRepository.findOne({
      status: PlantStatus.PENDING,
      treeId: dto.treeId,
    });

    if (pendingUpdates)
      throw new ForbiddenException(PlantErrorMessage.PENDING_UPDATE);

    await this.userService.updateUserById(user._id, {
      plantingNonce: userData.plantingNonce + 1,
    });

    const createdData = await this.updateTreeRepository.create({
      ...dto,
      signer,
      nonce: userData.plantingNonce,
    });

    return createdData._id;
  }

  async deleteUpdateTree(recordId: string, user): Promise<boolean> {
    const updateData = await this.updateTreeRepository.findOne({
      _id: recordId,
    });

    if (!updateData)
      throw new NotFoundException(PlantErrorMessage.UPDATE_DATA_NOT_EXIST);

    if (updateData.userId !== user.userId)
      throw new BadRequestException(AuthErrorMessages.INVALID_ACCESS);

    if (updateData.status != PlantStatus.PENDING)
      throw new BadRequestException(PlantErrorMessage.INVLID_STATUS);

    const result = await this.updateTreeRepository.softDeleteOne(
      {
        _id: recordId,
      },
      {
        status: PlantStatus.DELETE,
      }
    );

    return result.acknowledged;
  }

  async editUpdateTree(
    recordId: string,
    dto: EditUpdateTreeDto,
    user
  ): Promise<boolean> {
    const updateData = await this.updateTreeRepository.findOne({
      _id: recordId,
    });

    if (!updateData)
      throw new NotFoundException(PlantErrorMessage.UPDATE_DATA_NOT_EXIST);

    if (updateData.userId != user.userId)
      throw new BadRequestException(AuthErrorMessages.INVALID_ACCESS);

    if (updateData.status != PlantStatus.PENDING)
      throw new BadRequestException(PlantErrorMessage.INVLID_STATUS);

    let userData = await this.userService.findUserById(user.userId);

    const signer = await getSigner(
      dto.signature,
      {
        nonce: userData.plantingNonce,
        treeId: updateData.treeId,
        treeSpecs: dto.treeSpecs,
      },
      3
    );

    if (
      ethUtil.toChecksumAddress(signer) !==
      ethUtil.toChecksumAddress(userData.walletAddress)
    )
      throw new BadRequestException(AuthErrorMessages.INVALID_SIGNER);

    const result = await this.updateTreeRepository.updateOne(
      { _id: recordId },
      { ...dto, nonce: userData.plantingNonce }
    );

    return result.acknowledged;
  }

  async pendingListCount(filter): Promise<number> {
    return (
      (await this.assignedTreePlantRepository.count(filter)) +
      (await this.treePlantRepository.count(filter))
    );
  }
}
