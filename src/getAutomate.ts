import * as ts from "typescript";

export const automateDefault = false;

export function getAutomate(decorator: ts.ModifierLike) {
  if (decorator && ts.isDecorator(decorator)) {
    const expression = decorator.expression;
    if (ts.isCallExpression(expression) && expression.arguments.length > 1) {
      throw new Error(`Decorator @fn should not only one argument.`);
    }
    if (ts.isCallExpression(expression) && expression.arguments.length === 1) {
      const arg = expression.arguments[0];
      if (ts.isObjectLiteralExpression(arg)) {
        const descriptionProp = arg.properties.find(
          (prop) =>
            ts.isPropertyAssignment(prop) &&
            prop.name.getText() === "automated"
        );
        if (descriptionProp && ts.isPropertyAssignment(descriptionProp)) {
          const initializer = descriptionProp.initializer;
          if (initializer.kind === ts.SyntaxKind.FalseKeyword) {
            return false
          }
          if (initializer.kind === ts.SyntaxKind.TrueKeyword) {
            return true
          }
        }
      }
    }
  }
  return automateDefault;
}
