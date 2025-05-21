import * as ts from "typescript";

export function createSimpleFunctionSchemaExpression(schema: any, className: string, automated: boolean, parser: string): ts.Expression {
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
            schema.function.strict ? ts.factory.createTrue() : ts.factory.createFalse()
          ),
          ts.factory.createPropertyAssignment(
            "parameters",
            ts.factory.createObjectLiteralExpression(
              [
                ts.factory.createPropertyAssignment(
                  "type",
                  ts.factory.createStringLiteral(
                    schema.function.parameters.type
                  )
                ),
                ts.factory.createPropertyAssignment(
                  "properties",
                  ts.factory.createObjectLiteralExpression(
                    Object.keys(schema.function.parameters.properties).map(
                      (key) => {
                        const parameter =
                          schema.function.parameters.properties[key];
                        return ts.factory.createPropertyAssignment(
                          ts.factory.createStringLiteral(key),
                          ts.factory.createObjectLiteralExpression([
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
                              ts.factory.createStringLiteral(
                                parameter.description
                              )
                            ),
                          ])
                        );
                      }
                    ),
                    true
                  )
                ),
                ts.factory.createPropertyAssignment(
                  "required",
                  ts.factory.createArrayLiteralExpression(
                    schema.function.parameters.required.map((req: string) =>
                      ts.factory.createStringLiteral(req)
                    )
                  )
                ),
              ],
              true
            )
          ),
        ])
      ),
    ],
    true
  );
}