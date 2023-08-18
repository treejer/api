export const getPlanterDataForPlant = `{
    planter(id: "PLANTER_ID") {
      id
      status
      planterType
      plantedCount
      supplyCap
      memberOf {
        id
      },
    }
  }`;
