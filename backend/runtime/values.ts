//Values in runtime

export type ValueType = "null" | "int" | "bool" | "string";

export interface RuntimeVal {
  [x: string]: any;
  type?: ValueType;
  securityClass: number;
}

export interface NullVal extends RuntimeVal {
  type: "null";
  value: null;
}

export interface BooleanVal extends RuntimeVal {
  type: "bool";
  value: boolean;
}
export interface NumberVal extends RuntimeVal {
  type: "int";
  value: number;
}
export interface StringVal extends RuntimeVal {
  type: "string";
  value: string;
}

// helper functions for initialization
export function MK_NUMBER(n = 0, securityClass = 0) {
  return { type: "int", value: n, securityClass } as NumberVal;
}
export function MK_BOOL(value = false, securityClass = 0) {
  return { type: "bool", value, securityClass } as BooleanVal;
}
export function MK_STRING(str = "", securityClass = 0) {
  return { type: "string", value: str, securityClass } as StringVal;
}

export function MK_NULL(securityClass = 0) {
  return { type: "null", value: null, securityClass } as NullVal;
}
