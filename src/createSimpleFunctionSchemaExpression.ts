import * as ts from "typescript";

export function createSimpleFunctionSchemaExpression(schema: any): ts.Expression {
  return ts.factory.createObjectLiteralExpression(
    [
      ts.factory.createPropertyAssignment(
        "type",
        ts.factory.createStringLiteral(schema.type)
      ),
      ts.factory.createPropertyAssignment(
        "function",
        ts.factory.createObjectLiteralExpression([
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
            ts.factory.createArrayLiteralExpression(
              schema.function.parameters.map((parameter: any) =>
                ts.factory.createObjectLiteralExpression([
                  ts.factory.createPropertyAssignment(
                    "name",
                    ts.factory.createStringLiteral(parameter.name)
                  ),
                  ts.factory.createPropertyAssignment(
                    "type",
                    Array.isArray(parameter.type)
                      ? ts.factory.createArrayLiteralExpression(
                          parameter.type.map((t: string) =>
                            ts.factory.createStringLiteral(t)
                          )
                        )
                      : ts.factory.createStringLiteral(parameter.type)
                  ),
                  ts.factory.createPropertyAssignment(
                    "description",
                    ts.factory.createStringLiteral(parameter.description)
                  ),
                ])
              )
            )
          ),
        ])
      ),
    ],
    true
  );
}