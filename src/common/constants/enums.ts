export enum PlantStatus {
  PENDING = 1,
  VERIFIED = 2,
  REJECTED = 3,
  DELETE = 4,
}
export enum CollectionNames {
  USER = "users",
  UPDATE_TREES = "updatetrees",
  TREE_PLANT = "treeplants",
  ASSIGNED_TREE_PLANT = "assignedtreeplants",
}

export enum Role {
  USER = 1,
  PLANTER = 2,
  ADMIN = 3,
}

export enum EventName {
  TREE_ASSIGNED = "TreeAssigned",
  TREE_UPDATE = "TreeUpdatedVerified",
  TREE_PLANT = "TreeVerified",
}
