export interface OrbitportSeedResponse {
  service: string;
  src: string;
  data: string;
  signature: {
    value: string;
    pk: string;
    algo: string;
  };
}

export interface RandomSeedResponse {
  service: string;
  src: string;
  data: string;
  signature: {
    value: string;
    pk: string;
    algo: string;
  };
  usedFallback: boolean;
}
