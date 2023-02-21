import {
  CreateAssignedTreePlantDto,
  TreePlantDto,
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

import { JwtUserDto } from "src/auth/dtos";

var ethUtil = require("ethereumjs-util");

@Injectable()
export class PlantService {
  constructor(
    private updateTreeRepository: UpdateTreeRepository,
    private assignedTreePlantRepository: AssignedTreePlantRepository,
    private treePlantRepository: TreePlantRepository,
    private userService: UserService
  ) {}

<<<<<<< HEAD
  async plant(dto: TreePlantDto, user: JwtUserDto): Promise<string> {
    let userData = await this.userService.findUserById(user.userId);
=======
  async plant(dto: TreePlantDto, user): Promise<string> {
    let userData = await this.userService.findUserByWallet(user.walletAddress, {
      projection: { plantingNonce: 1 },
    });
>>>>>>> ef9c78e886d056048d37639897e95a5291e451ea

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
      ethUtil.toChecksumAddress(user.walletAddress)
    )
      throw new ForbiddenException(AuthErrorMessages.INVALID_SIGNER);

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
    const plantData = await this.treePlantRepository.findOne(
      {
        _id: recordId,
      },
      { projection: { signer: 1, status: 1 } }
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

    return result.acknowledged;
  }

  async editPlant(recordId: string, dto: TreePlantDto, user): Promise<boolean> {
    const plantData = await this.treePlantRepository.findOne(
      {
        _id: recordId,
      },
      { projection: { signer: 1, status: 1 } }
    );

    if (!plantData)
      throw new NotFoundException(PlantErrorMessage.PLANT_DATA_NOT_EXIST);

    if (plantData.signer != user.walletAddress)
      throw new ForbiddenException(AuthErrorMessages.INVALID_ACCESS);

    if (plantData.status !== PlantStatus.PENDING)
      throw new ConflictException(PlantErrorMessage.INVLID_STATUS);

    let userData = await this.userService.findUserByWallet(user.walletAddress, {
      projection: { plantingNonce: 1 },
    });

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
      ethUtil.toChecksumAddress(user.walletAddress)
    )
      throw new ForbiddenException(AuthErrorMessages.INVALID_SIGNER);

    await this.userService.updateUserById(userData._id, {
      plantingNonce: userData.plantingNonce + 1,
    });

    const result = await this.treePlantRepository.updateOne(
      { _id: recordId },
      { ...dto, nonce: userData.plantingNonce }
    );

    return result.acknowledged;
  }

  async plantAssignedTree(dto: CreateAssignedTreePlantDto, user: JwtUserDto) {
    let userData = await this.userService.findUserByWallet(user.walletAddress,  { plantingNonce: 1 });

    const signer = await getSigner(
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

    if (
      ethUtil.toChecksumAddress(signer) !==
      ethUtil.toChecksumAddress(user.walletAddress)
    )
      throw new ForbiddenException(AuthErrorMessages.INVALID_SIGNER);

    let plantData = await this.assignedTreePlantRepository.findOne(
      {
        treeId: dto.treeId,
        status: PlantStatus.PENDING,
      },
      {
         _id: 1 
      }
    );

    if (plantData)
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

    await this.userService.updateUserById(userData._id, {
      plantingNonce: userData.plantingNonce + 1,
    });

    return assignedPlant._id;
  }

  async editAssignedTree(
    recordId: string,
    data: EditTreeAssignPlantDto,
    user: JwtUserDto,
  ) {


    const assignedPlantData = await this.assignedTreePlantRepository.findOne({
      recordId,
    },{status:1,signer:1,_id:0});

    if (!assignedPlantData)
      throw new NotFoundException(PlantErrorMessage.INVALID_TREE_ID);
    


    if (assignedPlantData.signer != user.walletAddress)
      throw new ForbiddenException(AuthErrorMessages.INVALID_ACCESS);

    if (assignedPlantData.status != PlantStatus.PENDING)
      throw new ConflictException(PlantErrorMessage.INVLID_STATUS);

    let userData = await this.userService.findUserByWallet(user.walletAddress, {
 plantingNonce: 1 
    });

    const signer = await getSigner(
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

    if (
      ethUtil.toChecksumAddress(signer) !==
      ethUtil.toChecksumAddress(user.walletAddress)
    )
      throw new ForbiddenException(AuthErrorMessages.INVALID_SIGNER);

    await this.assignedTreePlantRepository.updateOne(
      {
       recordId
      },
      {
        ...data,
        nonce: userData.plantingNonce,
      }
    );

    await this.userService.updateUserById(user.userId, {
      plantingNonce: userData.plantingNonce + 1,
    });
  }

  async deleteAssignedTree(recordId: string, user: JwtUserDto) {

    const assignedPlantData = await this.assignedTreePlantRepository.findOne({
      recordId,
    },{status:1,signer:1,_id:0});

    if (!assignedPlantData)
      throw new NotFoundException(PlantErrorMessage.INVALID_TREE_ID);

    if (assignedPlantData.signer !== user.userId)
      throw new ForbiddenException(AuthErrorMessages.INVALID_ACCESS);

    if (assignedPlantData.status !== PlantStatus.PENDING)
      throw new ConflictException(PlantErrorMessage.INVLID_STATUS);

    await this.assignedTreePlantRepository.softDeleteOne(
      {
        recordId
      },
      {
        status: PlantStatus.DELETE,
      }
    );
  }

  async updateTree(dto: CreateUpdateTreeDto, user): Promise<string> {
    let userData = await this.userService.findUserByWallet(user.walletAddress, {
      projection: { plantingNonce: 1 },
    });

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
      ethUtil.toChecksumAddress(user.walletAddress)
    )
      throw new ForbiddenException(AuthErrorMessages.INVALID_SIGNER);

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
      throw new ConflictException(PlantErrorMessage.PENDING_UPDATE);

    await this.userService.updateUserById(userData._id, {
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

    if (updateData.signer != user.walletAddress)
      throw new ForbiddenException(AuthErrorMessages.INVALID_ACCESS);

    if (updateData.status != PlantStatus.PENDING)
      throw new ConflictException(PlantErrorMessage.INVLID_STATUS);

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
      throw new ForbiddenException(AuthErrorMessages.INVALID_SIGNER);

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
