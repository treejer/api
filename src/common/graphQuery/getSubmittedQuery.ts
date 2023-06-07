export const getSubmittedQuery = `{
    trees(where: { planter: "PLANTER_ID"}, skip: "SKIP", first: "FIRST"){
        id,
        treeStatus,
        plantDate
    }
  }`;
