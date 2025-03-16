import * as ts from "typescript";

export function getTypeInfoFromObject(
  type: ts.Type,
  typeChecker: ts.TypeChecker
): string | Record<string, any> {
  if (type.flags & ts.TypeFlags.Object) {
    const properties = typeChecker.getPropertiesOfType(type);
    const result: Record<string, any> = {};
    for (const prop of properties) {
      if (prop.valueDeclaration) {
        const propType = typeChecker.getTypeOfSymbolAtLocation(
          prop,
          prop.valueDeclaration
        );
        const typeNode = (prop.valueDeclaration as ts.ParameterDeclaration | ts.PropertyDeclaration)?.type;
        if (ts.isArrayTypeNode(typeNode)) {
          const elementTypeString = typeChecker.typeToString(
            typeChecker.getTypeFromTypeNode(typeNode.elementType)
          );
          result[prop.name] = {
            type: "array",
            items: {
              type: elementTypeString
            }
          };
        } else {
          result[prop.name] = getTypeInfoFromObject(propType, typeChecker);
        }
      }
    }
    return Object.keys(result).length > 0 ? result : "object";
  }
  const typeName = typeChecker.typeToString(type);
  
  // Handle Array types
  if (typeName.startsWith('Array<')) {
    let elementType = typeName.startsWith('Array<') 
      ? typeName.replace('Array<', '').replace('>', '')
      : typeName.replace('[]', '');

    // Handle object type in array
    if (elementType.includes('{')) {
      const typeRef = type as ts.TypeReference;
      const typeArgs = typeChecker.getTypeArguments(typeRef);
      if (typeArgs?.[0]) {
        return {
          type: 'array',
          items: {
            type: 'object',
            properties: getTypeInfoFromObject(typeArgs[0], typeChecker)
          }
        };
      }
    }
    
    // Handle union types in array
    if (elementType.includes('|')) {
      return {
        type: 'array',
        items: {
          oneOf: elementType.split('|').map(t => ({ type: t.trim() }))
        }
      };
    }
    
    return {
      type: 'array',
      items: {
        type: elementType
      }
    };
  }

  return typeName;
}