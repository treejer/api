import {
  CreateAssignedRequestDto,
  PlantRequestDto,
  EditAssignedRequestDto,
  CreateUpdateRequestDto,
  EditUpdateRequestDto,
} from "./dtos";
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";

import {
  AssignedTreePlantRepository,
  UpdateTreeRepository,
  TreePlantRepository,
} from "./plant.repository";

import { getCheckedSumAddress, getSigner } from "../common/helpers";
import { UserService } from "../user/user.service";
import {
  AuthErrorMessages,
  PlantErrorMessage,
  PlantStatus,
} from "../common/constants";
import { JwtUserDto } from "../auth/dtos";
import { Web3Service } from "src/web3/web3.service";

import { AssignedTreePlant, TreePlant, UpdateTree } from "./schemas";
import { PlantRequestsWithLimitResultDto } from "./dtos/plantRequestWithLimitResult.dto";
import { AssignedRequestWithLimitResultDto } from "./dtos/assignedRequestWithLimitResult.dto";
import { UpdateRequestWithLimitResultDto } from "./dtos/updateRequestWithLimitResult.dto";

@Injectable()
export class PlantService {
  constructor(
    private updateTreeRepository: UpdateTreeRepository,
    private assignedTreePlantRepository: AssignedTreePlantRepository,
    private treePlantRepository: TreePlantRepository,
    private userService: UserService,
    private web3Service: Web3Service
  ) {}

  async plant(dto: PlantRequestDto, user: JwtUserDto): Promise<TreePlant> {
    let userData = await this.userService.findUserByWallet(user.walletAddress, {
      plantingNonce: 1,
      _id: 0,
    });

    const signer = getSigner(
      dto.signature,
      {
        nonce: userData.plantingNonce,
        treeSpecs: dto.treeSpecs,
        birthDate: dto.birthDate,
        countryCode: dto.countryCode,
      },
      2
    );

    if (signer !== user.walletAddress)
      throw new ForbiddenException(AuthErrorMessages.INVALID_SIGNER);

    const planterData = await this.web3Service.getPlanterData(signer);

    if (Number(planterData.status) !== 1)
      throw new ForbiddenException(PlantErrorMessage.INVALID_PLANTER);

    let count = await this.getPendingListCount({
      signer,
    });

    if (
      Number(planterData.plantedCount) + count >=
      Number(planterData.supplyCap)
    )
      throw new ForbiddenException(PlantErrorMessage.SUPPLY_ERROR);

    const createdData = await this.treePlantRepository.create({
      ...dto,
      signer: user.walletAddress,
      nonce: userData.plantingNonce,
    });

    await this.userService.updateUserById(user.userId, {
      plantingNonce: userData.plantingNonce + 1,
    });

    return createdData;
  }

  async deletePlant(recordId: string, user: JwtUserDto) {
    const plantData = await this.treePlantRepository.findOne(
      {
        _id: recordId,
      },
      { signer: 1, status: 1, _id: 0 }
    );

    if (!plantData)
      throw new NotFoundException(PlantErrorMessage.PLANT_DATA_NOT_EXIST);

    if (plantData.signer !== user.walletAddress)
      throw new ForbiddenException(AuthErrorMessages.INVALID_ACCESS);

    if (plantData.status !== PlantStatus.PENDING)
      throw new ConflictException(PlantErrorMessage.INVLID_STATUS);

    await this.treePlantRepository.softDeleteOne(
      {
        _id: recordId,
      },
      {
        status: PlantStatus.DELETE,
      }
    );
  }

  async editPlant(
    recordId: string,
    dto: PlantRequestDto,
    user: JwtUserDto
  ): Promise<TreePlant> {
    const plantData = await this.treePlantRepository.findOne({
      _id: recordId,
    });

    if (!plantData)
      throw new NotFoundException(PlantErrorMessage.PLANT_DATA_NOT_EXIST);

    if (plantData.signer != user.walletAddress)
      throw new ForbiddenException(AuthErrorMessages.INVALID_ACCESS);

    if (plantData.status !== PlantStatus.PENDING)
      throw new ConflictException(PlantErrorMessage.INVLID_STATUS);

    let userData = await this.userService.findUserByWallet(user.walletAddress, {
      plantingNonce: 1,
      _id: 0,
    });

    const signer = getSigner(
      dto.signature,
      {
        nonce: userData.plantingNonce,
        treeSpecs: dto.treeSpecs,
        birthDate: dto.birthDate,
        countryCode: dto.countryCode,
      },
      2
    );

    if (signer !== user.walletAddress)
      throw new ForbiddenException(AuthErrorMessages.INVALID_SIGNER);

    await this.userService.updateUserById(user.userId, {
      plantingNonce: userData.plantingNonce + 1,
    });

    await this.treePlantRepository.updateOne(
      { _id: recordId },
      { ...dto, nonce: userData.plantingNonce }
    );

    Object.assign(plantData, dto, {
      nonce: userData.plantingNonce,
      updatedAt: new Date(),
    });

    return plantData;
  }

  //---------------------------  Assigned Tree ----------------------------------------------------

  async plantAssignedTree(
    dto: CreateAssignedRequestDto,
    user: JwtUserDto
  ): Promise<AssignedTreePlant> {
    let userData = await this.userService.findUserByWallet(user.walletAddress, {
      plantingNonce: 1,
      _id: 0,
    });

    const signer = getSigner(
      dto.signature,
      {
        nonce: userData.plantingNonce,
        treeId: dto.treeId,
        treeSpecs: dto.treeSpecs,
        birthDate: dto.birthDate,
        countryCode: dto.countryCode,
      },
      1
    );

    if (signer !== user.walletAddress)
      throw new ForbiddenException(AuthErrorMessages.INVALID_SIGNER);

    let plantData = await this.assignedTreePlantRepository.findOne(
      {
        treeId: dto.treeId,
        status: PlantStatus.PENDING,
      },
      {
        _id: 1,
      }
    );

    if (plantData)
      throw new ConflictException(PlantErrorMessage.PENDING_ASSIGNED_PLANT);

    let tree = await this.web3Service.getTreeData(dto.treeId);

    if (Number(tree.treeStatus) !== 2)
      throw new ForbiddenException(PlantErrorMessage.INVALID_TREE_STATUS);

    const planterData = await this.web3Service.getPlanterData(signer);

    if (Number(planterData.status) !== 1)
      throw new ForbiddenException(PlantErrorMessage.INVALID_PLANTER_STATUS);

    if (signer !== getCheckedSumAddress(tree.planter)) {
      if (
        !(
          Number(planterData.planterType) === 3 &&
          tree.planter ==
            (await this.web3Service.getPlanterOrganization(signer))
        )
      )
        throw new ForbiddenException(PlantErrorMessage.INVALID_PLANTER);
    }

    let pendingPlantsCount: number = await this.getPendingListCount({
      signer: signer,
    });

    if (
      Number(planterData.plantedCount) + pendingPlantsCount >=
      Number(planterData.supplyCap)
    )
      throw new ForbiddenException(PlantErrorMessage.SUPPLY_ERROR);

    const assignedPlant = await this.assignedTreePlantRepository.create({
      ...dto,
      nonce: userData.plantingNonce,
      signer: user.walletAddress,
    });

    await this.userService.updateUserById(user.userId, {
      plantingNonce: userData.plantingNonce + 1,
    });

    return assignedPlant;
  }

  async editAssignedTree(
    recordId: string,
    data: EditAssignedRequestDto,
    user: JwtUserDto
  ): Promise<AssignedTreePlant> {
    const assignedPlantData = await this.assignedTreePlantRepository.findOne({
      _id: recordId,
    });

    if (!assignedPlantData)
      throw new NotFoundException(
        PlantErrorMessage.ASSIGNED_TREE_DATA_NOT_EXIST
      );

    if (assignedPlantData.signer != user.walletAddress)
      throw new ForbiddenException(AuthErrorMessages.INVALID_ACCESS);

    if (assignedPlantData.status != PlantStatus.PENDING)
      throw new ConflictException(PlantErrorMessage.INVLID_STATUS);

    let userData = await this.userService.findUserByWallet(user.walletAddress, {
      plantingNonce: 1,
    });

    const signer = getSigner(
      data.signature,
      {
        nonce: userData.plantingNonce,
        treeId: assignedPlantData.treeId,
        treeSpecs: data.treeSpecs,
        birthDate: data.birthDate,
        countryCode: data.countryCode,
      },
      1
    );

    if (signer !== user.walletAddress)
      throw new ForbiddenException(AuthErrorMessages.INVALID_SIGNER);

    await this.userService.updateUserById(user.userId, {
      plantingNonce: userData.plantingNonce + 1,
    });

    await this.assignedTreePlantRepository.updateOne(
      {
        _id: recordId,
      },
      {
        ...data,
        nonce: userData.plantingNonce,
      }
    );

    Object.assign(assignedPlantData, data, {
      nonce: userData.plantingNonce,
      updatedAt: new Date(),
    });

    return assignedPlantData;
  }

  async deleteAssignedTree(recordId: string, user: JwtUserDto) {
    const assignedPlantData = await this.assignedTreePlantRepository.findOne(
      {
        _id: recordId,
      },
      { status: 1, signer: 1, _id: 0 }
    );

    if (!assignedPlantData)
      throw new NotFoundException(
        PlantErrorMessage.ASSIGNED_TREE_DATA_NOT_EXIST
      );

    if (assignedPlantData.signer !== user.walletAddress)
      throw new ForbiddenException(AuthErrorMessages.INVALID_ACCESS);

    if (assignedPlantData.status !== PlantStatus.PENDING)
      throw new ConflictException(PlantErrorMessage.INVLID_STATUS);

    await this.assignedTreePlantRepository.softDeleteOne(
      {
        _id: recordId,
      },
      {
        status: PlantStatus.DELETE,
      }
    );
  }

  async updateTree(
    dto: CreateUpdateRequestDto,
    user: JwtUserDto
  ): Promise<UpdateTree> {
    let userData = await this.userService.findUserByWallet(user.walletAddress, {
      plantingNonce: 1,
      _id: 0,
    });

    const signer = getSigner(
      dto.signature,
      {
        nonce: userData.plantingNonce,
        treeId: dto.treeId,
        treeSpecs: dto.treeSpecs,
      },
      3
    );

    if (signer !== user.walletAddress)
      throw new ForbiddenException(AuthErrorMessages.INVALID_SIGNER);

    let tree = await this.web3Service.getTreeData(dto.treeId);

    if (Number(tree.treeStatus) < 4)
      throw new ForbiddenException(PlantErrorMessage.INVALID_TREE_STATUS);

    if (signer !== getCheckedSumAddress(tree.planter))
      throw new ForbiddenException(PlantErrorMessage.INVALID_PLANTER);

    if (
      Math.floor(new Date().getTime() / 1000) <
      Number(tree.plantDate) + Number(tree.treeStatus) * 3600 + 604800
    )
      throw new ForbiddenException(PlantErrorMessage.EARLY_UPDATE);

    if (
      (await this.updateTreeRepository.count({
        status: PlantStatus.PENDING,
        treeId: dto.treeId,
      })) > 0
    )
      throw new ConflictException(PlantErrorMessage.PENDING_UPDATE);

    const createdData = await this.updateTreeRepository.create({
      ...dto,
      signer: user.walletAddress,
      nonce: userData.plantingNonce,
    });

    await this.userService.updateUserById(user.userId, {
      plantingNonce: userData.plantingNonce + 1,
    });

    return createdData;
  }

  async deleteUpdateTree(recordId: string, user: JwtUserDto) {
    const updateData = await this.updateTreeRepository.findOne(
      {
        _id: recordId,
      },
      { status: 1, signer: 1, _id: 0 }
    );

    if (!updateData)
      throw new NotFoundException(PlantErrorMessage.UPDATE_DATA_NOT_EXIST);

    if (updateData.signer !== user.walletAddress)
      throw new ForbiddenException(AuthErrorMessages.INVALID_ACCESS);

    if (updateData.status != PlantStatus.PENDING)
      throw new ConflictException(PlantErrorMessage.INVLID_STATUS);

    await this.updateTreeRepository.softDeleteOne(
      {
        _id: recordId,
      },
      {
        status: PlantStatus.DELETE,
      }
    );
  }

  async editUpdateTree(
    recordId: string,
    dto: EditUpdateRequestDto,
    user: JwtUserDto
  ): Promise<UpdateTree> {
    const updateData = await this.updateTreeRepository.findOne({
      _id: recordId,
    });

    if (!updateData)
      throw new NotFoundException(PlantErrorMessage.UPDATE_DATA_NOT_EXIST);

    if (updateData.signer != user.walletAddress)
      throw new ForbiddenException(AuthErrorMessages.INVALID_ACCESS);

    if (updateData.status != PlantStatus.PENDING)
      throw new ConflictException(PlantErrorMessage.INVLID_STATUS);

    let userData = await this.userService.findUserByWallet(user.walletAddress, {
      plantingNonce: 1,
      _id: 0,
    });

    const signer = getSigner(
      dto.signature,
      {
        nonce: userData.plantingNonce,
        treeId: updateData.treeId,
        treeSpecs: dto.treeSpecs,
      },
      3
    );

    if (signer !== user.walletAddress)
      throw new ForbiddenException(AuthErrorMessages.INVALID_SIGNER);

    const result = await this.updateTreeRepository.updateOne(
      { _id: recordId },
      { ...dto, nonce: userData.plantingNonce }
    );

    await this.userService.updateUserById(user.userId, {
      plantingNonce: userData.plantingNonce + 1,
    });

    Object.assign(updateData, dto, {
      nonce: userData.plantingNonce,
      updatedAt: new Date(),
    });

    return updateData;
  }

  async editPlantDataStatus(filter, status: number) {
    await this.treePlantRepository.updateOne(filter, { status });
  }

  async editAssignedTreeDataStatus(filter, status: number) {
    await this.assignedTreePlantRepository.updateOne(filter, {
      status,
    });
  }

  async editUpdateTreeDataStatus(filter, status: number) {
    await this.updateTreeRepository.updateOne(filter, {
      status,
    });
  }

  async getPlantData(filter): Promise<TreePlant> {
    return await this.treePlantRepository.findOne(filter);
  }

  async getAssignedTreeData(filter): Promise<AssignedTreePlant> {
    return await this.assignedTreePlantRepository.findOne(filter);
  }

  async getUpdateTreeData(filter): Promise<UpdateTree> {
    return await this.updateTreeRepository.findOne(filter);
  }

  async getPlantRequests(
    filter,
    sortOption,
    projection?
  ): Promise<TreePlant[]> {
    return await this.treePlantRepository.sort(filter, sortOption, projection);
  }

  async getPlantRequestsWithLimit(
    limit,
    filter,
    sortOption,
    projection?
  ): Promise<PlantRequestsWithLimitResultDto> {
    const data = await this.treePlantRepository.findWithLimit(
      limit,
      filter,
      sortOption,
      projection
    );

    const count = await this.treePlantRepository.count(filter);

    // @ts-ignore
    return { data, count };
  }

  async getAssignedTreeRequests(
    filter,
    sortOption,
    projection?
  ): Promise<AssignedTreePlant[]> {
    return await this.assignedTreePlantRepository.sort(
      filter,
      sortOption,
      projection
    );
  }

  async getAssignedTreeRequestsWithLimit(
    limit,
    filter,
    sortOption,
    projection?
  ): Promise<AssignedRequestWithLimitResultDto> {
    const data = await this.assignedTreePlantRepository.findWithLimit(
      limit,
      filter,
      sortOption,
      projection
    );

    const count = await this.assignedTreePlantRepository.count(filter);

    // @ts-ignore
    return { data, count };
  }

  async getUpdateTreeRequests(
    filter,
    sortOption,
    projection?
  ): Promise<UpdateTree[]> {
    return await this.updateTreeRepository.sort(filter, sortOption, projection);
  }

  async getUpdateTreeRequestsWithLimit(
    limit,
    filter,
    sortOption,
    projection?
  ): Promise<UpdateRequestWithLimitResultDto> {
    const data = await this.updateTreeRepository.findWithLimit(
      limit,
      filter,
      sortOption,
      projection
    );

    const count = await this.updateTreeRepository.count(filter);

    // @ts-ignore
    return { data, count };
  }

  async getPendingListCount(filter): Promise<number> {
    return (
      (await this.assignedTreePlantRepository.count({
        ...filter,
        status: PlantStatus.PENDING,
      })) +
      (await this.treePlantRepository.count({
        ...filter,
        status: PlantStatus.PENDING,
      }))
    );
  }
}
