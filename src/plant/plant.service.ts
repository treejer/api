import {
  CreateAssignedRequestDto,
  PlantRequestDto,
  EditAssignedRequestDto,
  CreateUpdateRequestDto,
  EditUpdateRequestDto,
  PlantRequestStatusEditResultDto,
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
import {
  CreateRequestResult,
  DeleteRequestResult,
  EditRequestResultDto,
  AssignedRequestStatusEditResultDto,
  UpdateRequestStatusEditResultDto,
} from "./dtos";
import { PlantRequestResultDto } from "./dtos/plantRequestResult.dto";
import { AssignedTreePlant, TreePlant, UpdateTree } from "./schemas";

@Injectable()
export class PlantService {
  constructor(
    private updateTreeRepository: UpdateTreeRepository,
    private assignedTreePlantRepository: AssignedTreePlantRepository,
    private treePlantRepository: TreePlantRepository,
    private userService: UserService,
    private web3Service: Web3Service
  ) {}

  async plant(
    dto: PlantRequestDto,
    user: JwtUserDto
  ): Promise<CreateRequestResult> {
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

    if (planterData.status != 1)
      throw new ForbiddenException(PlantErrorMessage.INVALID_PLANTER);

    let count = await this.pendingListCount({
      signer,
      status: PlantStatus.PENDING,
    });

    if (planterData.plantedCount + count >= planterData.supplyCap)
      throw new ForbiddenException(PlantErrorMessage.SUPPLY_ERROR);

    const createdData = await this.treePlantRepository.create({
      ...dto,
      signer,
      nonce: userData.plantingNonce,
    });

    await this.userService.updateUserById(user.userId, {
      plantingNonce: userData.plantingNonce + 1,
    });
    return { recordId: createdData._id };
  }

  async deletePlant(
    recordId: string,
    user: JwtUserDto
  ): Promise<DeleteRequestResult> {
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

    const result = await this.treePlantRepository.softDeleteOne(
      {
        _id: recordId,
      },
      {
        status: PlantStatus.DELETE,
      }
    );

    return { acknowledged: result.acknowledged };
  }

  async editPlant(
    recordId: string,
    dto: PlantRequestDto,
    user: JwtUserDto
  ): Promise<EditRequestResultDto> {
    const plantData = await this.treePlantRepository.findOne(
      {
        _id: recordId,
      },
      { signer: 1, status: 1, _id: 0 }
    );

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

    const result = await this.treePlantRepository.updateOne(
      { _id: recordId },
      { ...dto, nonce: 1 }
    );

    await this.userService.updateUserById(user.userId, {
      plantingNonce: 1 + 1,
    });

    return { acknowledged: result.acknowledged };
  }

  async editPlantDataStatus(
    filter,
    status: number
  ): Promise<PlantRequestStatusEditResultDto> {
    const result = await this.treePlantRepository.updateOne(filter, { status });

    return { acknowledged: result.acknowledged };
  }

  async editAssignedTreeDataStatus(
    filter,
    status: number
  ): Promise<AssignedRequestStatusEditResultDto> {
    const result = await this.assignedTreePlantRepository.updateOne(filter, {
      status,
    });

    return { acknowledged: result.acknowledged };
  }

  async editUpdateTreeDataStatus(
    filter,
    status: number
  ): Promise<UpdateRequestStatusEditResultDto> {
    const result = await this.updateTreeRepository.updateOne(filter, {
      status,
    });

    return { acknowledged: result.acknowledged };
  }

  //---------------------------  Assigned Tree ----------------------------------------------------

  async plantAssignedTree(
    dto: CreateAssignedRequestDto,
    user: JwtUserDto
  ): Promise<CreateRequestResult> {
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

    if (tree.treeStatus != 2)
      throw new ForbiddenException(PlantErrorMessage.INVALID_TREE_STATUS);

    const planterData = await this.web3Service.getPlanterData(signer);

    if (planterData.status != 1)
      throw new ForbiddenException(PlantErrorMessage.INVALID_PLANTER_STATUS);

    if (signer !== getCheckedSumAddress(tree.planter)) {
      if (
        !(
          planterData.planterType == 3 &&
          tree.planter ==
            (await this.web3Service.getPlanterOrganization(signer))
        )
      )
        throw new ForbiddenException(PlantErrorMessage.INVALID_PLANTER);
    }

    let pendingPlantsCount: number = await this.pendingListCount({
      signer: signer,
      status: PlantStatus.PENDING,
    });

    if (planterData.plantedCount + pendingPlantsCount >= planterData.supplyCap)
      throw new ForbiddenException(PlantErrorMessage.SUPPLY_ERROR);

    const assignedPlant = await this.assignedTreePlantRepository.create({
      ...dto,
      nonce: userData.plantingNonce,
      signer: user.walletAddress,
    });

    await this.userService.updateUserById(user.userId, {
      plantingNonce: userData.plantingNonce + 1,
    });

    return { recordId: assignedPlant._id };
  }

  async editAssignedTree(
    recordId: string,
    data: EditAssignedRequestDto,
    user: JwtUserDto
  ): Promise<EditRequestResultDto> {
    const assignedPlantData = await this.assignedTreePlantRepository.findOne(
      {
        _id: recordId,
      },
      { status: 1, signer: 1, treeId: 1, _id: 0 }
    );

    if (!assignedPlantData)
      throw new NotFoundException(PlantErrorMessage.INVALID_RECORD_ID);

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

    const result = await this.assignedTreePlantRepository.updateOne(
      {
        _id: recordId,
      },
      {
        ...data,
        nonce: userData.plantingNonce,
      }
    );

    return { acknowledged: result.acknowledged };
  }

  async deleteAssignedTree(
    recordId: string,
    user: JwtUserDto
  ): Promise<DeleteRequestResult> {
    const assignedPlantData = await this.assignedTreePlantRepository.findOne(
      {
        _id: recordId,
      },
      { status: 1, signer: 1, _id: 0 }
    );

    if (!assignedPlantData)
      throw new NotFoundException(PlantErrorMessage.INVALID_TREE_ID);

    if (assignedPlantData.signer !== user.walletAddress)
      throw new ForbiddenException(AuthErrorMessages.INVALID_ACCESS);

    if (assignedPlantData.status !== PlantStatus.PENDING)
      throw new ConflictException(PlantErrorMessage.INVLID_STATUS);

    const result = await this.assignedTreePlantRepository.softDeleteOne(
      {
        _id: recordId,
      },
      {
        status: PlantStatus.DELETE,
      }
    );

    return { acknowledged: result.acknowledged };
  }

  async updateTree(
    dto: CreateUpdateRequestDto,
    user: JwtUserDto
  ): Promise<CreateRequestResult> {
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

    if (tree.treeStatus < 4)
      throw new ForbiddenException(PlantErrorMessage.INVALID_TREE_STATUS);

    if (signer !== getCheckedSumAddress(tree.planter))
      throw new ForbiddenException(PlantErrorMessage.INVALID_PLANTER);

    if (
      Math.floor(new Date().getTime() / 1000) <
      tree.plantDate + tree.treeStatus * 3600 + 604800
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
      signer,
      nonce: userData.plantingNonce,
    });

    await this.userService.updateUserById(user.userId, {
      plantingNonce: userData.plantingNonce + 1,
    });

    return { recordId: createdData._id };
  }

  async deleteUpdateTree(
    recordId: string,
    user: JwtUserDto
  ): Promise<DeleteRequestResult> {
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

    const result = await this.updateTreeRepository.softDeleteOne(
      {
        _id: recordId,
      },
      {
        status: PlantStatus.DELETE,
      }
    );

    return { acknowledged: result.acknowledged };
  }

  async editUpdateTree(
    recordId: string,
    dto: EditUpdateRequestDto,
    user: JwtUserDto
  ): Promise<EditRequestResultDto> {
    const updateData = await this.updateTreeRepository.findOne(
      {
        _id: recordId,
      },
      { status: 1, signer: 1, treeId: 1, _id: 0 }
    );

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

    return { acknowledged: result.acknowledged };
  }

  async getPlantData(filter) {
    return await this.treePlantRepository.findOne(filter);
  }

  async getAssignedTreeData(filter) {
    return await this.assignedTreePlantRepository.findOne(filter);
  }

  async getUpdateTreeData(filter) {
    return await this.updateTreeRepository.findOne(filter);
  }

  async getPlantRequests(filter, sortOption, projection): Promise<TreePlant[]> {
    return await this.treePlantRepository.sort(filter, sortOption, projection);
  }

  async getAssignedTreeRequests(
    filter,
    sortOption,
    projection
  ): Promise<AssignedTreePlant[]> {
    return await this.assignedTreePlantRepository.sort(
      filter,
      sortOption,
      projection
    );
  }

  async getUpdateTreeRequests(
    filter,
    sortOption,
    projection
  ): Promise<UpdateTree[]> {
    return await this.updateTreeRepository.sort(filter, sortOption, projection);
  }

  async pendingListCount(filter): Promise<number> {
    return (
      (await this.assignedTreePlantRepository.count(filter)) +
      (await this.treePlantRepository.count(filter))
    );
  }
}
