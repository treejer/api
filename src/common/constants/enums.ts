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
  LAST_STATE = "laststates",
  USER_MOBILE = "usermobiles",
  APPLICATION = "applications",
  FILE = "files",
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

export enum ApplicationTypes {
  ORGANIZATIONAL_PLANTER = 1,
  PLANTER,
}

export enum ApplicationStatuses {
  PENDING = 1,
  ACCEPTED,
  REJECTED,
}
export enum FileModules {
  idcard = 1,
}
