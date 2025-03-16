import * as ts from "typescript";

export function getParser(decorator: ts.ModifierLike) {
  if (decorator && ts.isDecorator(decorator)) {
    const expression = decorator.expression;
    if (ts.isCallExpression(expression) && expression.arguments.length > 1) {
      throw new Error(`Decorator @fn should not only one argument.`);
    }
    if (ts.isCallExpression(expression) && expression.arguments.length === 1) {
      const arg = expression.arguments[0];
      if (ts.isObjectLiteralExpression(arg)) {
        const prop = arg.properties.find(
          (prop) =>
            ts.isPropertyAssignment(prop) &&
            prop.name.getText() === "parser"
        );
        if (prop && ts.isPropertyAssignment(prop)) {
          const initializer = prop.initializer;
          if (ts.isStringLiteral(initializer)) {
            return initializer.text; // This will return the string without quotes
          }
        }
      }
    }
  }
  return "JSON.parse";
}
