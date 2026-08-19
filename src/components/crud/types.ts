export type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "date"
  | "select"
  | "checkbox"
  | "relation"
  | "image";

export interface SelectOption {
  value: string;
  label: string;
  color?: string; // tailwind classes for badge styling
}

export interface RelationConfig {
  table: string;
  labelField: string;
}

export interface ColumnDef {
  key: string;
  label: string;
  type: FieldType;
  options?: SelectOption[];
  relation?: RelationConfig;
  required?: boolean;
  step?: string;
  summary?: boolean; // shown in the compact row summary
  hideInForm?: boolean;
  placeholder?: string;
}
