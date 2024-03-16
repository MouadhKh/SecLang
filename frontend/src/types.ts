export type ErrorObject = {
  message: string;
  type: string;
};

export type VarObject = {
  name: string;
  type?: string;
  securityClassInt: number;
  securityClassStr: string;
};

export type ChannelObject = {
  name: string; //==security class
  content: string[];
};

export type SecurityClassColors = {
  Unclassified: string;
  Confidential: string;
  Secret: string;
  TopSecret: string;
};
