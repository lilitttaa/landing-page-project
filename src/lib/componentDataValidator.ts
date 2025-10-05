import { ComponentMetaData, PropertyDefinition, ValidationError, ValidationResult } from '../types/component-meta';
import * as fs from 'fs';
import * as path from 'path';

export class ComponentDataValidator {
  private metaDataCache: Map<string, ComponentMetaData> = new Map();
  private metaDir: string;

  constructor(metaDir?: string) {
    this.metaDir = metaDir || path.join(process.cwd(), 'src', 'components', 'meta');
  }

  /**
   * Load meta data for a specific component
   */
  private loadMetaData(componentName: string): ComponentMetaData {
    if (this.metaDataCache.has(componentName)) {
      return this.metaDataCache.get(componentName)!;
    }

    const metaFilePath = path.join(this.metaDir, `${componentName}.meta.json`);
    
    if (!fs.existsSync(metaFilePath)) {
      throw new Error(`Meta data file not found for component: ${componentName}`);
    }

    try {
      const metaContent = fs.readFileSync(metaFilePath, 'utf-8');
      const metaData: ComponentMetaData = JSON.parse(metaContent);
      this.metaDataCache.set(componentName, metaData);
      return metaData;
    } catch (error) {
      throw new Error(`Failed to parse meta data for component ${componentName}: ${error}`);
    }
  }

  /**
   * Validate user data against component meta data
   */
  validateComponentData(componentName: string, userData: any): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    try {
      const metaData = this.loadMetaData(componentName);
      
      // Validate against properties schema
      this.validateObject(userData, metaData.properties, metaData.types || {}, '', errors, warnings);
      
      return {
        isValid: errors.length === 0,
        errors,
        warnings
      };
    } catch (error) {
      return {
        isValid: false,
        errors: [{
          path: '',
          message: `Validation failed: ${error}`,
          code: 'META_DATA_ERROR'
        }]
      };
    }
  }

  /**
   * Validate an object against property definitions
   */
  private validateObject(
    data: any, 
    properties: Record<string, PropertyDefinition>,
    types: Record<string, Record<string, PropertyDefinition>>,
    currentPath: string,
    errors: ValidationError[],
    warnings: ValidationError[]
  ): void {
    
    // Check for required properties
    for (const [propName, propDef] of Object.entries(properties)) {
      const propPath = currentPath ? `${currentPath}.${propName}` : propName;
      
      if (propDef.required && (data[propName] === undefined || data[propName] === null)) {
        errors.push({
          path: propPath,
          message: `Required property '${propName}' is missing`,
          code: 'REQUIRED_PROPERTY_MISSING'
        });
        continue;
      }

      if (data[propName] !== undefined) {
        this.validateProperty(data[propName], propDef, types, propPath, errors, warnings);
      }
    }

    // Check for unexpected properties
    if (data && typeof data === 'object') {
      for (const key of Object.keys(data)) {
        if (!properties[key]) {
          warnings.push({
            path: currentPath ? `${currentPath}.${key}` : key,
            message: `Unexpected property '${key}' found`,
            code: 'UNEXPECTED_PROPERTY'
          });
        }
      }
    }
  }

  /**
   * Validate a single property
   */
  private validateProperty(
    value: any,
    propDef: PropertyDefinition,
    types: Record<string, Record<string, PropertyDefinition>>,
    currentPath: string,
    errors: ValidationError[],
    warnings: ValidationError[]
  ): void {
    
    // Type validation
    switch (propDef.type) {
      case 'string':
        if (typeof value !== 'string') {
          errors.push({
            path: currentPath,
            message: `Expected string, got ${typeof value}`,
            code: 'TYPE_MISMATCH'
          });
          return;
        }
        this.validateStringConstraints(value, propDef, currentPath, errors);
        break;

      case 'number':
        if (typeof value !== 'number') {
          errors.push({
            path: currentPath,
            message: `Expected number, got ${typeof value}`,
            code: 'TYPE_MISMATCH'
          });
          return;
        }
        this.validateNumberConstraints(value, propDef, currentPath, errors);
        break;

      case 'boolean':
        if (typeof value !== 'boolean') {
          errors.push({
            path: currentPath,
            message: `Expected boolean, got ${typeof value}`,
            code: 'TYPE_MISMATCH'
          });
        }
        break;

      case 'array':
        if (!Array.isArray(value)) {
          errors.push({
            path: currentPath,
            message: `Expected array, got ${typeof value}`,
            code: 'TYPE_MISMATCH'
          });
          return;
        }
        this.validateArrayItems(value, propDef, types, currentPath, errors, warnings);
        break;

      case 'object':
        if (typeof value !== 'object' || value === null) {
          errors.push({
            path: currentPath,
            message: `Expected object, got ${typeof value}`,
            code: 'TYPE_MISMATCH'
          });
          return;
        }
        this.validateObjectProperties(value, propDef, types, currentPath, errors, warnings);
        break;
    }

    // Enum validation
    if (propDef.enum && !propDef.enum.includes(value)) {
      errors.push({
        path: currentPath,
        message: `Value '${value}' is not in allowed values: ${propDef.enum.join(', ')}`,
        code: 'ENUM_VIOLATION'
      });
    }
  }

  /**
   * Validate string constraints
   */
  private validateStringConstraints(
    value: string,
    propDef: PropertyDefinition,
    currentPath: string,
    errors: ValidationError[]
  ): void {
    if (propDef.minLength && value.length < propDef.minLength) {
      errors.push({
        path: currentPath,
        message: `String too short. Minimum length: ${propDef.minLength}, got: ${value.length}`,
        code: 'MIN_LENGTH_VIOLATION'
      });
    }

    if (propDef.maxLength && value.length > propDef.maxLength) {
      errors.push({
        path: currentPath,
        message: `String too long. Maximum length: ${propDef.maxLength}, got: ${value.length}`,
        code: 'MAX_LENGTH_VIOLATION'
      });
    }

    if (propDef.pattern) {
      const regex = new RegExp(propDef.pattern);
      if (!regex.test(value)) {
        errors.push({
          path: currentPath,
          message: `String does not match required pattern: ${propDef.pattern}`,
          code: 'PATTERN_VIOLATION'
        });
      }
    }
  }

  /**
   * Validate number constraints
   */
  private validateNumberConstraints(
    value: number,
    propDef: PropertyDefinition,
    currentPath: string,
    errors: ValidationError[]
  ): void {
    if (propDef.min !== undefined && value < propDef.min) {
      errors.push({
        path: currentPath,
        message: `Number too small. Minimum: ${propDef.min}, got: ${value}`,
        code: 'MIN_VALUE_VIOLATION'
      });
    }

    if (propDef.max !== undefined && value > propDef.max) {
      errors.push({
        path: currentPath,
        message: `Number too large. Maximum: ${propDef.max}, got: ${value}`,
        code: 'MAX_VALUE_VIOLATION'
      });
    }
  }

  /**
   * Validate array items
   */
  private validateArrayItems(
    value: any[],
    propDef: PropertyDefinition,
    types: Record<string, Record<string, PropertyDefinition>>,
    currentPath: string,
    errors: ValidationError[],
    warnings: ValidationError[]
  ): void {
    if (propDef.arrayItemType) {
      value.forEach((item, index) => {
        const itemPath = `${currentPath}[${index}]`;
        this.validateProperty(item, propDef.arrayItemType!, types, itemPath, errors, warnings);
      });
    }
  }

  /**
   * Validate object properties
   */
  private validateObjectProperties(
    value: any,
    propDef: PropertyDefinition,
    types: Record<string, Record<string, PropertyDefinition>>,
    currentPath: string,
    errors: ValidationError[],
    warnings: ValidationError[]
  ): void {
    if (propDef.properties) {
      this.validateObject(value, propDef.properties, types, currentPath, errors, warnings);
    }
  }

  /**
   * Get default values for a component
   */
  getDefaultValues(componentName: string): any {
    const metaData = this.loadMetaData(componentName);
    return metaData.defaults || {};
  }

  /**
   * Merge user data with default values, only keeping valid properties
   */
  mergeWithDefaults(componentName: string, userData: any): any {
    const metaData = this.loadMetaData(componentName);
    const defaults = metaData.defaults || {};
    
    // 只保留在 properties 中定义的有效字段
    const validProperties = Object.keys(metaData.properties || {});
    const cleanedUserData = this.filterValidProperties(userData, validProperties);
    
    return this.deepMerge(defaults, cleanedUserData);
  }

  /**
   * Filter object to only include valid properties
   */
  private filterValidProperties(data: any, validProperties: string[]): any {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return data;
    }

    const filtered: any = {};
    
    for (const key of validProperties) {
      if (data.hasOwnProperty(key)) {
        filtered[key] = data[key];
      }
    }
    
    return filtered;
  }

  /**
   * Deep merge two objects
   */
  private deepMerge(defaults: any, override: any): any {
    if (override === null || override === undefined) {
      return defaults;
    }

    if (typeof defaults !== 'object' || typeof override !== 'object') {
      return override;
    }

    if (Array.isArray(defaults) || Array.isArray(override)) {
      return override;
    }

    const result = { ...defaults };
    
    for (const key in override) {
      if (override.hasOwnProperty(key)) {
        if (typeof defaults[key] === 'object' && typeof override[key] === 'object') {
          result[key] = this.deepMerge(defaults[key], override[key]);
        } else {
          result[key] = override[key];
        }
      }
    }

    return result;
  }

  /**
   * Clear meta data cache
   */
  clearCache(): void {
    this.metaDataCache.clear();
  }
}