import * as ts from "typescript";

export function isDecorator(
  modifier: ts.ModifierLike,
  decoratorName: string
): boolean {
  if (!ts.isDecorator(modifier)) return false;
  
  const expression = modifier.expression;
  if (ts.isIdentifier(expression)) {
    // Case: @fn
    return expression.text === decoratorName;
  } else if (ts.isCallExpression(expression)) {
    // Case: @fn({ description: "..." })
    const callee = expression.expression;
    if (ts.isIdentifier(callee)) {
      return callee.text === decoratorName;
    }
  }
  return false;
}
