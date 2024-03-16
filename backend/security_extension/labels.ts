export enum SecurityLabel {
  Unclassified = 0,
  Confidential = 16000,
  Secret = Number.MAX_SAFE_INTEGER - 1000000000000000, 
  TopSecret = Number.MAX_SAFE_INTEGER,
}
export function getSecurityClassAsString(securityLabel:SecurityLabel):string{
  switch(securityLabel){
    case SecurityLabel.Unclassified:
      return "Unclassified";
      case SecurityLabel.Confidential:
      return "Confidential";
      case SecurityLabel.Secret:
      return "Secret";
      case SecurityLabel.TopSecret:
      return "TopSecret";
      default:
        return "UNDEFINED_SECURITY_CLASS";
  }
}
