
export const getSubmittedQuery = (planterAddress:string,skip:number,limit:number) => {
    return `{
        trees(skip:${skip},first:${limit},where: { planter:"${planterAddress.toLowerCase()}"}){
          id
          treeStatus
          plantDate
        }
    }`
};
