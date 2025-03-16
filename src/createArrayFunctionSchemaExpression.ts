import * as ts from "typescript";
import { createItemsExpression } from "./createItemsExpression";

export function createArrayFunctionSchemaExpression(schema: any, automated: boolean, parser: string): ts.Expression {
  return ts.factory.createObjectLiteralExpression(
    [
      ts.factory.createPropertyAssignment(
        "type",
        ts.factory.createStringLiteral(schema.type)
      ),
      ts.factory.createPropertyAssignment(
        "function",
        ts.factory.createObjectLiteralExpression([
          ...(automated ? [
            ts.factory.createPropertyAssignment(
              "function",
              ts.factory.createIdentifier(schema.function.name)
            ),
          ] : []),
          ...(automated ? [
            ts.factory.createPropertyAssignment(
              "parse",
              ts.factory.createIdentifier(parser)
            ),
          ] : []),
          ts.factory.createPropertyAssignment(
            "name",
            ts.factory.createStringLiteral(schema.function.name)
          ),
          ts.factory.createPropertyAssignment(
            "description",
            ts.factory.createStringLiteral(schema.function.description)
          ),
          ts.factory.createPropertyAssignment(
            "strict",
            schema.function.strict ? ts.factory.createTrue() : ts.factory.createFalse()
          ),
          ts.factory.createPropertyAssignment(
            "parameters",
            ts.factory.createObjectLiteralExpression([
              ts.factory.createPropertyAssignment(
                "name",
                ts.factory.createStringLiteral(schema.function.parameters[0].name)
              ),
              ts.factory.createPropertyAssignment(
                "type",
                ts.factory.createStringLiteral(schema.function.parameters[0].type)
              ),
              ts.factory.createPropertyAssignment(
                "description",
                ts.factory.createStringLiteral(schema.function.parameters[0].description)
              ),
              ts.factory.createPropertyAssignment(
                "items",
                createItemsExpression(schema.function.parameters[0].items)
              )
            ])
          )
        ])
      )
    ],
    true
  );
}

