import { InternalServerErrorException } from "@nestjs/common";
import { Document, FilterQuery, Model, UpdateQuery } from "mongoose";
import { IUpdateOne } from "./interfaces";
export abstract class EntityRepository<T extends Document> {
  constructor(protected readonly entityModel: Model<T>) {}

  async find(
    entityFilterQuery: FilterQuery<T>,
    projection?: Record<string, null>
  ): Promise<T[]> {
    try {
      return await this.entityModel.find(entityFilterQuery, { ...projection });
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async findId(
    entityFilterQuery: FilterQuery<T>,
    projection?: Record<string, number>
  ): Promise<T[]> {
    try {
      return await this.entityModel.find(entityFilterQuery, { ...projection });
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async count(
    entityFilterQuery: FilterQuery<T>,
    projection?: Record<string, null>
  ): Promise<number> {
    try {
      return await this.entityModel
        .find(entityFilterQuery, { ...projection })
        .count();
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async sort(
    entityFilterQuery: FilterQuery<T>,
    sortFilter: any,
    projection?: Record<string, number>
  ): Promise<T[]> {
    try {
      return await this.entityModel
        .find(entityFilterQuery, { ...projection })
        .sort(sortFilter);
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }
  async findWithPaginate(
    skip,
    limit,
    entityFilterQuery: FilterQuery<T>,
    sortFilter: any,
    projection?: Record<string, number>
  ): Promise<T[]> {
    try {
      const query = this.entityModel
        .find(entityFilterQuery, { ...projection })
        .sort(sortFilter)
        .skip(skip);

      if (limit) {
        query.limit(limit);
      }

      return await query;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async findOne(
    entityFilterQuery: FilterQuery<T>,
    projection?: Record<string, number>
  ): Promise<T | null> {
    try {
      return await this.entityModel.findOne(entityFilterQuery, {
        ...projection,
      });
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async create(entityData: unknown): Promise<T> {
    try {
      const entityInstance = new this.entityModel(entityData);

      return await entityInstance.save();
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }
  async findOneAndUpdate(
    entityFilterQuery: FilterQuery<T>,
    entityData: UpdateQuery<unknown>,
    removeDataList?: Array<string>
  ): Promise<T> {
    try {
      if (!removeDataList) {
        return await this.entityModel.findOneAndUpdate(entityFilterQuery, {
          ...entityData,
          updatedAt: new Date(),
        });
      } else {
        return await this.entityModel.findOneAndUpdate(entityFilterQuery, [
          {
            $set: {
              ...entityData,
              updatedAt: new Date(),
            },
          },
          { $unset: removeDataList },
        ]);
      }
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async updateOne(
    entityFilterQuery: FilterQuery<T>,
    entityData: UpdateQuery<unknown>,
    removeDataList?: Array<string>
  ): Promise<IUpdateOne> {
    try {
      if (!removeDataList) {
        return await this.entityModel.updateOne(entityFilterQuery, {
          ...entityData,
          updatedAt: new Date(),
        });
      } else {
        return await this.entityModel.updateOne(entityFilterQuery, [
          {
            $set: {
              ...entityData,
              updatedAt: new Date(),
            },
          },
          { $unset: removeDataList },
        ]);
      }
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async softDeleteOne(
    entityFilterQuery: FilterQuery<T>,
    entityData: UpdateQuery<unknown>
  ): Promise<IUpdateOne> {
    try {
      return await this.entityModel.updateOne(entityFilterQuery, {
        ...entityData,
        updatedAt: new Date(),
        deletedAt: new Date(),
      });
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async deleteMany(entityFilterQuery: FilterQuery<T>): Promise<boolean> {
    try {
      const deleteResult = await this.entityModel.deleteMany(entityFilterQuery);
      return deleteResult.deletedCount > 0;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async deleteOne(entityFilterQuery: FilterQuery<T>): Promise<boolean> {
    try {
      const deleteResult = await this.entityModel.deleteOne(entityFilterQuery);
      return deleteResult.deletedCount > 0;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async replaceOne(filter, replacement) {
    try {
      const result = await this.entityModel.replaceOne(filter, replacement);

      return result.acknowledged;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }
}
