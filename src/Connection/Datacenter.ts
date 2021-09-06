export function Datacenter(dcId: number, test?: boolean): string {
  const TEST: { [key: number]: string } = {
    1: '149.154.175.10',
    2: '149.154.167.40',
    3: '149.154.175.117'
  };

  const PROD: { [key: number]: string } = {
    1: '149.154.175.53',
    2: '149.154.167.50',
    3: '149.154.175.100',
    4: '149.154.167.91',
    5: '91.108.56.130'
  };

  if (test) {
    if (TEST[dcId] == undefined)
      throw Error(`Datacenter ${dcId} is not available for test mode`);
    return TEST[dcId];
  }
  if (PROD[dcId] == undefined)
    throw Error(`Datacenter ${dcId} is not available for production mode`);
  return PROD[dcId];
}
