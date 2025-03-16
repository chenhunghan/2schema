import * as ts from "typescript";

/**
 * TypeScript 5.0+ stage 3 decorators
 */
export function makeFactorialDecorator(
  decoratorName: string,
  decoratorBody: ts.Statement[]
) {
  const decoraterFunctionName = ts.factory.createIdentifier(decoratorName);

  return ts.factory.createFunctionDeclaration(
    /*modifiers*/ undefined,
    /*asteriskToken*/ undefined,
    decoraterFunctionName,
    /*typeParameters*/
    [],
    /*parameters*/
    [
      ts.factory.createParameterDeclaration(
        undefined,
        undefined,
        ts.factory.createIdentifier("target"),
        undefined,
        undefined
      ),
      ts.factory.createParameterDeclaration(
        undefined,
        undefined,
        ts.factory.createIdentifier("context"),
        undefined,
        undefined
      ),
    ],
    undefined,
    ts.factory.createBlock(decoratorBody, /*multiline*/ true)
  );
}
