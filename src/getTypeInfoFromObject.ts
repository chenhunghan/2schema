import * as ts from "typescript";

export function getTypeInfoFromObject(
  type: ts.Type,
  typeChecker: ts.TypeChecker,
  descriptions?: Record<string, { description: string }>,
  propertyName?: string // Added to get specific description for the current property
): string | Record<string, any> {
  // Handle array types first
  if (typeChecker.isArrayType(type)) {
    const elementType = typeChecker.getElementTypeOfArrayType(type);
    if (elementType) {
      // Pass descriptions down for array elements if relevant (e.g. array of objects)
      const itemsSchema = getTypeInfoFromObject(elementType, typeChecker, descriptions);
      const items = typeof itemsSchema === 'string' ? { type: itemsSchema } : itemsSchema;
      let schema: Record<string, any> = { type: "array", items: items };
      if (propertyName && descriptions && descriptions[propertyName]) {
        schema.description = descriptions[propertyName].description;
      }
      return schema;
    }
  } else if (typeChecker.isTupleType(type)) {
     const elementTypes = typeChecker.getTypeArguments(type as ts.TypeReference);
     let schema: Record<string, any> = {
        type: "array",
        items: elementTypes.map(elType => {
            const itemSchema = getTypeInfoFromObject(elType, typeChecker, descriptions);
            return typeof itemSchema === 'string' ? { type: itemSchema } : itemSchema;
        })
     };
      if (propertyName && descriptions && descriptions[propertyName]) {
        schema.description = descriptions[propertyName].description;
      }
     return schema;
  }

  if (type.flags & ts.TypeFlags.Object || type.isClassOrInterface()) {
    const baseSchema: Record<string, any> = {};
    if (propertyName && descriptions && descriptions[propertyName]) {
      baseSchema.description = descriptions[propertyName].description;
    }

    if (typeChecker.typeToString(type) === "object" && type.getProperties().length === 0) {
        return { ...baseSchema, type: "object", properties: {}, required: [] };
    }
    
    const properties = typeChecker.getPropertiesOfType(type);
    if (properties.length === 0 && type.getStringIndexType() === undefined && type.getNumberIndexType() === undefined) {
        return { ...baseSchema, type: "object", properties: {}, required: [] };
    }

    const result: Record<string, any> = {};
    const requiredProperties: string[] = [];

    for (const prop of properties) {
      if (prop.valueDeclaration) {
        const propType = typeChecker.getTypeOfSymbolAtLocation(
          prop,
          prop.valueDeclaration
        );
        // Pass the full descriptions map and the current property's name
        result[prop.name] = getTypeInfoFromObject(propType, typeChecker, descriptions, prop.name);
        if (!(prop.flags & ts.SymbolFlags.Optional)) {
          requiredProperties.push(prop.name);
        }
      }
    }
    return { ...baseSchema, type: "object", properties: result, required: requiredProperties };
  }

  // Handle simple types and union types
  let finalSchema: any;
  const typeName = typeChecker.typeToString(type);

  if (type.isUnion()) {
    const unionTypes = type.types.map(t => getTypeInfoFromObject(t, typeChecker, descriptions /*, propertyName for member? */));
    const oneOf = unionTypes.map(ut => typeof ut === 'string' ? { type: ut } : ut);
    if (oneOf.every(o => typeof o === 'object' && o.hasOwnProperty('type') && Object.keys(o).length === (o.hasOwnProperty('description') ? 2 :1))) {
        finalSchema = typeName; // Behaves like a simple type if all members are simple
    } else {
        finalSchema = { oneOf };
    }
  } else {
    finalSchema = typeName;
  }

  if (propertyName && descriptions && descriptions[propertyName]) {
    if (typeof finalSchema === 'string') {
      return { type: finalSchema, description: descriptions[propertyName].description };
    } else if (typeof finalSchema === 'object') { // It should be an object for oneOf
      return { ...finalSchema, description: descriptions[propertyName].description };
    }
  }
  
  return finalSchema;
}