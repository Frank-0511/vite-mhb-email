/**
 * @fileoverview Tipos e interfaces de la biblioteca de componentes.
 * Módulo hoja con cero runtime: solo declaraciones de tipo.
 */

import type { COMPONENT_TYPE } from "./constants.ts";

export type LibraryComponentType = (typeof COMPONENT_TYPE)[keyof typeof COMPONENT_TYPE];

export type FormPropType = "boolean" | "select" | "textarea" | "number" | "date" | "text";

export interface LibraryProp {
  default?: string | number | boolean;
  label?: string;
  type?: FormPropType;
  options?: Array<{ value: string; label?: string }>;
}

export interface LibraryComponent {
  id?: string;
  name: string;
  path: string;
  type?: string;
  variants?: Array<{ id?: string }>;
  props?: Record<string, LibraryProp>;
  _id?: string;
}

export interface LibraryGroup {
  type: LibraryComponentType;
  name: string;
  icon: string;
  itemIcon: string;
  items: LibraryComponent[];
}

export interface LibraryState {
  currentComponent: LibraryComponent | null;
  currentVariant: string | null;
  currentType: LibraryComponentType | null;
  formData: Record<string, unknown>;
  allComponents: LibraryComponent[];
}
