import { Model, Document, FilterQuery, UpdateQuery } from "mongoose";
import { IUpdateOne } from "./interfaces";
export abstract class EntityRepository<T extends Document> {
  constructor(protected readonly entityModel: Model<T>) {}

  async find(
    entityFilterQuery: FilterQuery<T>,
    projection?: Record<string, null>
  ): Promise<T[]> {
    return await this.entityModel.find(entityFilterQuery, { ...projection });
  }

  async count(
    entityFilterQuery: FilterQuery<T>,
    projection?: Record<string, null>
  ): Promise<number> {
    return await this.entityModel
      .find(entityFilterQuery, { ...projection })
      .count();
  }

  async sort(
    entityFilterQuery: FilterQuery<T>,
    sortFilter: any,
    projection?: Record<string, null>
  ): Promise<T[]> {
    return await this.entityModel
      .find(entityFilterQuery, { ...projection })
      .sort(sortFilter);
  }

  async findOne(
    entityFilterQuery: FilterQuery<T>,
    projection?: Record<string, object>
  ): Promise<T | null> {
    return await this.entityModel.findOne(entityFilterQuery, { ...projection });
  }

  async create(entityData: unknown): Promise<T> {
    const entityInstance = new this.entityModel(entityData);

    return entityInstance.save();
  }
  async findOneAndUpdate(
    entityFilterQuery: FilterQuery<T>,
    entityData: UpdateQuery<unknown>
  ): Promise<T> {
    return await this.entityModel.findOneAndUpdate(
      entityFilterQuery,
      entityData,
      {
        new: true,
      }
    );
  }

  async updateOne(
    entityFilterQuery: FilterQuery<T>,
    entityData: UpdateQuery<unknown>
  ): Promise<IUpdateOne> {
    return await this.entityModel.updateOne(entityFilterQuery, {
      ...entityData,
      updatedAt: new Date(),
    });
  }

  async softDeleteOne(
    entityFilterQuery: FilterQuery<T>,
    entityData: UpdateQuery<unknown>
  ): Promise<IUpdateOne> {
    return await this.entityModel.updateOne(entityFilterQuery, {
      ...entityData,
      updatedAt: new Date(),
      deletedAt: new Date(),
    });
  }

  async deleteMany(entityFilterQuery: FilterQuery<T>): Promise<boolean> {
    const deleteResult = await this.entityModel.deleteMany(entityFilterQuery);
    return deleteResult.deletedCount > 0;
  }

  async deleteOne(entityFilterQuery: FilterQuery<T>): Promise<boolean> {
    const deleteResult = await this.entityModel.deleteOne(entityFilterQuery);
    return deleteResult.deletedCount > 0;
  }
}
