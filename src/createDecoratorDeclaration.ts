import * as ts from "typescript";
import { makeFactorialDecorator } from "./makeFactorialDecorator";

export function createDecoratorDeclaration(decoratorName: string, schemaVariableName: string) {
  return makeFactorialDecorator(decoratorName, [
    ts.factory.createFunctionDeclaration(
      undefined,
      undefined,
      ts.factory.createIdentifier("method"),
      undefined,
      [
        ts.factory.createParameterDeclaration(
          undefined,
          ts.factory.createToken(ts.SyntaxKind.DotDotDotToken),
          ts.factory.createIdentifier("args"),
          undefined,
          undefined
        ),
      ],
      undefined,
      ts.factory.createBlock([
        ts.factory.createReturnStatement(
          ts.factory.createCallExpression(
            ts.factory.createPropertyAccessExpression(
              ts.factory.createIdentifier("target"),
              ts.factory.createIdentifier("call")
            ),
            undefined,
            [
              ts.factory.createThis(),
              ts.factory.createSpreadElement(
                ts.factory.createIdentifier("args")
              ),
            ]
          )
        ),
      ])
    ),
    ts.factory.createExpressionStatement(
      ts.factory.createAssignment(
        ts.factory.createPropertyAccessExpression(
          ts.factory.createIdentifier("method"),
          ts.factory.createIdentifier("toJSONSchema")
        ),
        ts.factory.createArrowFunction(
          undefined,
          undefined,
          [],
          undefined,
          ts.factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
          ts.factory.createIdentifier(schemaVariableName)
        )
      )
    ),
    ts.factory.createReturnStatement(ts.factory.createIdentifier("method")),
  ]);
}
