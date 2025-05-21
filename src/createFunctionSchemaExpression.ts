import * as ts from "typescript";
import { createItemsExpression } from "./createItemsExpression";
import { createObjectLiteral } from "./createObjectLiteral";

export function createFunctionSchemaExpression(schema: any, className: string, automated: boolean, parser: string): ts.Expression {
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
              ts.factory.createIdentifier(`${className}.${schema.function.name}`)
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
            schema.function.strict
              ? ts.factory.createTrue()
              : ts.factory.createFalse()
          ),
          ts.factory.createPropertyAssignment(
            "parameters",
            ts.factory.createObjectLiteralExpression([
              ts.factory.createPropertyAssignment(
                "type",
                ts.factory.createStringLiteral(schema.function.parameters.type)
              ),
              ts.factory.createPropertyAssignment(
                "properties",
                ts.factory.createObjectLiteralExpression(
                  Object.entries(schema.function.parameters.properties).map(
                    ([key, propertySchema]: [string, any]) => // propertySchema is the schema for this property
                      ts.factory.createPropertyAssignment(
                        ts.factory.createStringLiteral(key), // Use createStringLiteral for safety
                        createObjectLiteral(propertySchema) // Use the main createObjectLiteral
                      )
                  ),
                  true // multiline
                )
              ),
              ts.factory.createPropertyAssignment(
                "required",
                ts.factory.createArrayLiteralExpression(
                  schema.function.parameters.required.map((name: string) =>
                    ts.factory.createStringLiteral(name)
                  )
                )
              ),
              ts.factory.createPropertyAssignment(
                "additionalProperties",
                schema.function.parameters.additionalProperties
                  ? ts.factory.createTrue()
                  : ts.factory.createFalse()
              ),
            ])
          ),
        ])
      ),
    ],
    true
  );
}
