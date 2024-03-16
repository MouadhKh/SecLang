import { SecurityClassColors } from "./types";

export const getColorForSecurityClass = (
    securityClassStr: keyof SecurityClassColors
  ): string => {
    return colorMappings[securityClassStr];
  };
  
export const colorMappings: SecurityClassColors = {
    Unclassified: "#A8DF8E",
    Confidential: "#1E96FC",
    Secret: "#E57A44",
    TopSecret: "#F8333C",
  };