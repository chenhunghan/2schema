import * as ts from "typescript";

// Helper function to create object literal from nested type info
export function createObjectLiteral(
  value: Record<string, any> | Array<any> | string | boolean | number // Allow Array and primitives
): ts.Expression { // Return type can be more general
  if (typeof value === 'string') {
    return ts.factory.createStringLiteral(value);
  }
  if (typeof value === 'number') {
    return ts.factory.createNumericLiteral(value);
  }
  if (typeof value === 'boolean') {
    return value ? ts.factory.createTrue() : ts.factory.createFalse();
  }
  if (Array.isArray(value)) {
    return ts.factory.createArrayLiteralExpression(
      value.map((item) => createObjectLiteral(item as any)) // Recursive call for array items
    );
  }
  // If it's an object (Record<string, any>)
  if (typeof value === 'object' && value !== null) {
    const properties = Object.entries(value).map(([key, val]) => {
        let propertyValueAst;
        // Check if the key is 'properties' and its value is an empty object
        if (key === 'properties' && typeof val === 'object' && val !== null && Object.keys(val).length === 0) {
            propertyValueAst = ts.factory.createObjectLiteralExpression([], false);
        } else {
            propertyValueAst = createObjectLiteral(val as any);
        }
        return ts.factory.createPropertyAssignment(
            // Using createStringLiteral for keys is safer to handle all characters.
            // Alternatively, createIdentifier if it's known to be a valid identifier.
            ts.factory.createStringLiteral(key),
            propertyValueAst
        );
    });
    return ts.factory.createObjectLiteralExpression(properties, true);
  }
  // Fallback for unknown types, though ideally all paths should be handled
  return ts.factory.createIdentifier("undefined"); 
}