import {
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import {
  CreateAssignedRequestDto,
  CreateUpdateRequestDto,
  EditAssignedRequestDto,
  EditUpdateRequestDto,
  PlantRequestDto,
} from "./dtos";

import {
  AssignedTreePlantRepository,
  TreePlantRepository,
  UpdateTreeRepository,
} from "./plant.repository";

import { JwtUserDto } from "../auth/dtos";
import {
  AuthErrorMessages,
  CommonErrorMessage,
  PlantErrorMessage,
  PlantStatus,
  TreeErrorMessage,
  submittedQueryEnum,
} from "../common/constants";
import { getCheckedSumAddress, getSigner } from "../common/helpers";
import { UserService } from "../user/user.service";

import { ConfigService } from "@nestjs/config";
import axios from "axios";
import { getSubmittedQuery } from "src/common/graphQuery/getSubmittedQuery";
import { GraphService } from "src/graph/graph.service";
import { AssignedRequestWithLimitResultDto } from "./dtos/assignedRequestWithLimitResult.dto";
import { PlantRequestsWithLimitResultDto } from "./dtos/plantRequestWithLimitResult.dto";
import { UpdateRequestWithLimitResultDto } from "./dtos/updateRequestWithLimitResult.dto";
import { AssignedTreePlant, TreePlant, UpdateTree } from "./schemas";

@Injectable()
export class PlantService {
  constructor(
    private updateTreeRepository: UpdateTreeRepository,
    private assignedTreePlantRepository: AssignedTreePlantRepository,
    private treePlantRepository: TreePlantRepository,
    private userService: UserService,
    private graphService: GraphService,
    private config: ConfigService
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

    const planterData = await this.graphService.getPlanterData(signer);

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

    createdData.signature = undefined;

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

    plantData.signature = undefined;

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

    let tree = await this.graphService.getTreeData(dto.treeId.toString());

    if (Number(tree.treeStatus) !== 2)
      throw new ForbiddenException(PlantErrorMessage.INVALID_TREE_STATUS);

    const planterData = await this.graphService.getPlanterData(signer);

    if (Number(planterData.status) !== 1)
      throw new ForbiddenException(PlantErrorMessage.INVALID_PLANTER_STATUS);

    if (signer !== getCheckedSumAddress(tree.planter)) {
      if (
        !(
          Number(planterData.planterType) === 3 &&
          getCheckedSumAddress(tree.planter) ==
            getCheckedSumAddress(planterData.memberOf)
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

    assignedPlant.signature = undefined;
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

    assignedPlantData.signature = undefined;
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

    let tree = await this.graphService.getTreeData(dto.treeId.toString());

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

    createdData.signature = undefined;
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

    await this.updateTreeRepository.updateOne(
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

    updateData.signature = undefined;
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

  async getPlantRequests(filter, sortOption): Promise<TreePlant[]> {
    return await this.treePlantRepository.sort(filter, sortOption, {
      _id: 1,
      signer: 1,
      nonce: 1,
      treeSpecs: 1,
      birthDate: 1,
      countryCode: 1,
      status: 1,
      createdAt: 1,
      updatedAt: 1,
    });
  }

  async getPlantRequestsWithLimit(
    signer,
    skip,
    limit,
    filter,
    sortOption
  ): Promise<PlantRequestsWithLimitResultDto> {
    const filterQuery = {
      ...filter,
      signer,
      status: { $ne: PlantStatus.DELETE },
    };

    const data = await this.treePlantRepository.findWithPaginate(
      skip * limit,
      limit,
      filterQuery,
      sortOption,
      {
        _id: 1,
        signer: 1,
        nonce: 1,
        treeSpecs: 1,
        birthDate: 1,
        countryCode: 1,
        status: 1,
        createdAt: 1,
        updatedAt: 1,
      }
    );

    const count = await this.treePlantRepository.count(filterQuery);

    // @ts-ignore
    return { data, count };
  }

  async getAssignedTreeRequests(
    filter,
    sortOption
  ): Promise<AssignedTreePlant[]> {
    return await this.assignedTreePlantRepository.sort(filter, sortOption, {
      _id: 1,
      signer: 1,
      nonce: 1,
      treeId: 1,
      treeSpecs: 1,
      birthDate: 1,
      countryCode: 1,
      status: 1,
      createdAt: 1,
      updatedAt: 1,
    });
  }

  async getAssignedTreeRequestsWithLimit(
    signer,
    skip,
    limit,
    filter,
    sortOption
  ): Promise<AssignedRequestWithLimitResultDto> {
    const filterQuery = {
      ...filter,
      signer,
      status: { $ne: PlantStatus.DELETE },
    };

    const data = await this.assignedTreePlantRepository.findWithPaginate(
      skip * limit,
      limit,
      filterQuery,
      sortOption,
      {
        _id: 1,
        signer: 1,
        nonce: 1,
        treeId: 1,
        treeSpecs: 1,
        birthDate: 1,
        countryCode: 1,
        status: 1,
        createdAt: 1,
        updatedAt: 1,
      }
    );

    const count = await this.assignedTreePlantRepository.count(filterQuery);

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
    signer,
    skip,
    limit,
    filter,
    sortOption
  ): Promise<UpdateRequestWithLimitResultDto> {
    const filterQuery = {
      ...filter,
      signer,
      status: { $ne: PlantStatus.DELETE },
    };

    const data = await this.updateTreeRepository.findWithPaginate(
      skip * limit,
      limit,
      filterQuery,
      sortOption,
      {
        _id: 1,
        signer: 1,
        nonce: 1,
        treeId: 1,
        treeSpecs: 1,
        status: 1,
        createdAt: 1,
        updatedAt: 1,
      }
    );

    const count = await this.updateTreeRepository.count(filterQuery);

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

  async getSubmittedData(
    planterAddress: string,
    skip: number,
    limit: number
  ): Promise<any> {
    if (limit > 30) {
      throw new ForbiddenException(CommonErrorMessage.SKIP_LIMIT);
    }

    const theGraphUrl = this.config.get<string>("THE_GRAPH_URL");

    if (!theGraphUrl) {
      throw new InternalServerErrorException(
        TreeErrorMessage.GRAPH_SOURCE_URL_NOT_SET
      );
    }

    let localLimit = Number(limit) + 1;

    let localSkip = Number(limit) * skip;

    try {
      const postBody = JSON.stringify({
        query: getSubmittedQuery(planterAddress, localSkip, localLimit),
        variables: null,
      });

      const res = await axios.post(theGraphUrl, postBody);

      if (res.status == 200 && res.data.data) {
        let data = res.data.data.trees;

        let hasMore = false;

        if (data.length == localLimit) {
          hasMore = true;
        }

        data.pop();

        data = await Promise.all(
          data.map(async (ele) => {
            let item = ele;

            if (Number(item.treeStatus) < 4) {
              let assignedCount = await this.getAssignPendingListCount({
                treeId: parseInt(item.id, 16),
                status: PlantStatus.PENDING,
              });

              if (assignedCount > 0) {
                item.status = submittedQueryEnum.Pending;
              } else {
                item.status = submittedQueryEnum.Assigned;
              }
            } else if (Number(item.treeStatus) >= 4) {
              let updatedCount = await this.getUpdatePendingListCount({
                treeId: parseInt(item.id, 16),
                status: PlantStatus.PENDING,
              });

              if (updatedCount > 0) {
                item.status = submittedQueryEnum.Pending;
              } else {
                if (
                  Math.floor(new Date().getTime() / 1000) <
                  Number(item.plantDate) +
                    Number(item.treeStatus) * 3600 +
                    604800
                ) {
                  item.status = submittedQueryEnum.Verified;
                } else {
                  item.status = submittedQueryEnum.CanUpdate;
                }
              }
            }

            return item;
          })
        );

        return { hasMore: hasMore, data: data };
      } else {
        throw new InternalServerErrorException();
      }
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  async getAssignedTreeRequestsJustId(filter, sortOption): Promise<string[]> {
    let list: string[] = (
      await this.assignedTreePlantRepository.sort(filter, sortOption, {
        treeId: 1,
      })
    ).map((item) => {
      return item.treeId;
    });

    return list;
  }

  async getUpdateTreeRequestsJustId(filter, sortOption): Promise<string[]> {
    let list: string[] = (
      await this.updateTreeRepository.sort(filter, sortOption, {
        treeId: 1,
      })
    ).map((item) => {
      return item.treeId;
    });

    return list;
  }

  async getAssignPendingListCount(filter): Promise<number> {
    return await this.assignedTreePlantRepository.count({
      ...filter,
    });
  }

  async getUpdatePendingListCount(filter): Promise<number> {
    return await this.updateTreeRepository.count({
      ...filter,
    });
  }
}
