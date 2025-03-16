import * as ts from "typescript";

// Helper function to create object literal from nested type info
export function createObjectLiteral(
  value: Record<string, any>
): ts.ObjectLiteralExpression {
  return ts.factory.createObjectLiteralExpression(
    Object.entries(value).map(([key, val]) =>
      ts.factory.createPropertyAssignment(
        ts.factory.createIdentifier(key),
        typeof val === "string"
          ? ts.factory.createStringLiteral(val)
          : createObjectLiteral(val)
      )
    ),
    true
  );
}