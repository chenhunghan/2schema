import * as ts from "typescript";

export function createVariableStatement(
  variableName: string,
  expression: ts.Expression
): ts.VariableStatement {
  const functionSchemaDeclaration = ts.factory.createVariableStatement(
    undefined,
    ts.factory.createVariableDeclarationList(
      [
        ts.factory.createVariableDeclaration(
          ts.factory.createIdentifier(variableName),
          undefined,
          undefined,
          expression
        ),
      ],
      ts.NodeFlags.Const
    )
  );

  return functionSchemaDeclaration;
}
