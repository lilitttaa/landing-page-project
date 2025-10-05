// Meta data types for component schema definition
export interface PropertyDefinition {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required: boolean;
  description?: string;
  defaultValue?: any;
  // For array types
  arrayItemType?: PropertyDefinition;
  // For object types
  properties?: Record<string, PropertyDefinition>;
  // For string validation
  pattern?: string;
  minLength?: number;
  maxLength?: number;
  // For number validation
  min?: number;
  max?: number;
  // For enum values
  enum?: any[];
}

export interface ComponentMetaData {
  componentName: string;
  version: string;
  description?: string;
  category?: string;
  properties: Record<string, PropertyDefinition>;
  // Nested type definitions
  types?: Record<string, Record<string, PropertyDefinition>>;
  // Default values
  defaults?: Record<string, any>;
  // Examples
  examples?: Record<string, any>[];
}

export interface ValidationError {
  path: string;
  message: string;
  code: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings?: ValidationError[];
}