import * as ts from "typescript";

export function createItemsExpression(items: any): ts.Expression {
  // Handle union types (oneOf)
  if (Array.isArray(items.oneOf)) {
    return ts.factory.createObjectLiteralExpression([
      ts.factory.createPropertyAssignment(
        "oneOf",
        ts.factory.createArrayLiteralExpression(
          items.oneOf.map((typeObj: any) =>
            ts.factory.createObjectLiteralExpression([
              ts.factory.createPropertyAssignment(
                "type",
                ts.factory.createStringLiteral(typeObj.type || typeObj)
              )
            ])
          )
        )
      )
    ]);
  }

  // Handle object type
  if (items.type === "object") {
    return ts.factory.createObjectLiteralExpression([
      ts.factory.createPropertyAssignment(
        "type",
        ts.factory.createStringLiteral("object")
      ),
      ts.factory.createPropertyAssignment(
        "properties",
        ts.factory.createObjectLiteralExpression(
          Object.entries(items.properties).map(([key, value]: [string, any]) =>
            ts.factory.createPropertyAssignment(
              key,
              ts.factory.createObjectLiteralExpression([
                ts.factory.createPropertyAssignment(
                  "type",
                  ts.factory.createStringLiteral(value.type)
                )
              ])
            )
          )
        )
      )
    ]);
  }

  // Handle nested array
  if (items.type === "array") {
    return ts.factory.createObjectLiteralExpression([
      ts.factory.createPropertyAssignment(
        "type",
        ts.factory.createStringLiteral("array")
      ),
      ts.factory.createPropertyAssignment(
        "items",
        createItemsExpression(items.items)
      )
    ]);
  }

  // Handle simple type
  return ts.factory.createObjectLiteralExpression([
    ts.factory.createPropertyAssignment(
      "type",
      ts.factory.createStringLiteral(items.type)
    )
  ]);
}