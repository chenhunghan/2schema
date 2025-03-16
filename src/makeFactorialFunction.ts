import * as ts from "typescript";

export function makeFactorialFunction(fnName: string, fnBody: ts.Statement[]) {
  const functionName = ts.factory.createIdentifier(fnName);

  return ts.factory.createFunctionDeclaration(
    /*decorators*/ undefined,
    /*asteriskToken*/ undefined,
    functionName,
    /*typeParameters*/ undefined,
    [],
    /*returnType*/ ts.factory.createKeywordTypeNode(
      ts.SyntaxKind.NumberKeyword
    ),
    ts.factory.createBlock([], /*multiline*/ true)
  );
}