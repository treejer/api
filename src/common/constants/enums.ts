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
  MAGIC_AUTH = "magicauths",
  ETHER_VALUE = "ethervalues",
}

export enum Role {
  USER = 1,
  PLANTER = 2,
  ADMIN = 3,
}

export enum UserStatus {
  NOT_VERIFIED = 1,
  PENDING = 2,
  VERIFIED = 3,
}

export enum EventName {
  TREE_ASSIGNED = "AssignedTreeVerifiedWithSign",
  TREE_UPDATE = "TreeUpdatedVerifiedWithSign",
  TREE_PLANT = "TreeVerifiedWithSign",
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


export enum submittedQueryEnum {
  Pending = "Pending", // platner submitted request for plant or update but it hasn't accepted yet
  Assigned = "Assigned", // tree assigned to planter but planter hasn't submmited request for that
  Verified = "Verified", // tree is stable (there is not any pending request for that and The update time has not arrived yet)
  CanUpdate= "CanUpdate", // tree is stable and planter must be submit update request for that
}
