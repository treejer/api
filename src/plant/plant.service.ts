import {
  CreateAssignedTreePlantDto,
  CreateTreePlantDto,
  UpdateTreeDto,
} from "./dtos";
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
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

var ethUtil = require("ethereumjs-util");

@Injectable()
export class PlantService {
  constructor(
    private updateTreeRepository: UpdateTreeRepository,
    private assignedTreePlantRepository: AssignedTreePlantRepository,
    private treePlantRepository: TreePlantRepository,
    private userService: UserService
  ) {}

  async plantAssignedTree(dto: CreateAssignedTreePlantDto) {
    let user = await this.userService.findUserByWallet(dto.signer);

    if (!user) throw new ForbiddenException(AuthErrorMessages.USER_NOT_EXIST);

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

    let plantData = await this.assignedTreePlantRepository.findOne({
      treeId: dto.treeId,
    });

    if (plantData && plantData.status == PlantStatus.PENDING)
      throw new ForbiddenException(PlantErrorMessage.PENDING_ASSIGNED_PLANT);
    if (plantData && plantData.status == PlantStatus.VERIFIED)
      throw new ForbiddenException(PlantErrorMessage.VERIFIED_ASSIGNED_PLANT);

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

    if (plantData) {
      const updatedAssigndPlantData =
        await this.assignedTreePlantRepository.findOneAndUpdate(
          { _id: plantData._id },
          { ...dto }
        );
      return updatedAssigndPlantData._id;
    }

    await this.userService.updateUserById(user._id, {
      plantingNonce: user.plantingNonce + 1,
    });

    const assignedPlant = await this.assignedTreePlantRepository.create({
      ...dto,
    });

    return assignedPlant._id;
  }

  async plant(dto: CreateTreePlantDto) {
    let user = await this.userService.findUserByWallet(dto.signer);

    if (!user) throw new ForbiddenException(AuthErrorMessages.USER_NOT_EXIST);

    const signer = await getSigner(
      dto.signature,
      {
        nonce: user.plantingNonce,
        treeSpecs: dto.treeSpecs,
        birthDate: dto.birthDate,
        countryCode: dto.countryCode,
      },
      2
    );

    if (
      ethUtil.toChecksumAddress(signer) !==
      ethUtil.toChecksumAddress(dto.signer)
    )
      throw new BadRequestException(AuthErrorMessages.INVALID_SIGNER);

    const planterData = await getPlanterData(signer);

    if (planterData.status != 1)
      throw new ForbiddenException(PlantErrorMessage.INVALID_PLANTER);

    let count: number = await this.pendingListCount({
      signer: dto.signer,
      status: PlantStatus.PENDING,
    });

    if (planterData.plantedCount + count >= planterData.supplyCap)
      throw new ForbiddenException(PlantErrorMessage.SUPPLY_ERROR);

    await this.userService.updateUserById(user._id, {
      plantingNonce: user.plantingNonce + 1,
    });

    const plantData = await this.treePlantRepository.create({ ...dto });

    return plantData._id;
  }

  async updateTree(dto: UpdateTreeDto) {
    let tree = await getTreeData(dto.treeId);

    let user = await this.userService.findUserByWallet(dto.signer);

    if (!user) throw new ForbiddenException(AuthErrorMessages.USER_NOT_EXIST);

    const signer: string = await getSigner(
      dto.signature,
      {
        nonce: user.plantingNonce,
        treeId: dto.treeId,
        treeSpecs: dto.treeSpecs,
      },
      3
    );

    if (
      ethUtil.toChecksumAddress(signer) !==
      ethUtil.toChecksumAddress(dto.signer)
    )
      throw new BadRequestException(AuthErrorMessages.INVALID_SIGNER);

    if (tree.treeStatus < 3)
      throw new ForbiddenException(PlantErrorMessage.INVALID_TREE_STATUS);

    if (
      ethUtil.toChecksumAddress(tree.planter) !==
      ethUtil.toChecksumAddress(dto.signer)
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
      plantingNonce: user.plantingNonce + 1,
    });

    const updateData = await this.updateTreeRepository.create({ ...dto });

    return updateData._id;
  }

  async pendingListCount(filter): Promise<number> {
    return (
      (await this.assignedTreePlantRepository.count(filter)) +
      (await this.treePlantRepository.count(filter))
    );
  }
}