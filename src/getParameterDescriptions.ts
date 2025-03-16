import * as ts from "typescript";

export function getParameterDescriptions(decorator: ts.ModifierLike) {
  const descriptions: Record<string, Record<string, string>> = {};

  if (decorator && ts.isDecorator(decorator)) {
    const expression = decorator.expression;
    if (ts.isCallExpression(expression) && expression.arguments.length === 1) {
      const arg = expression.arguments[0];
      if (ts.isObjectLiteralExpression(arg)) {
        const paramsProp = arg.properties.find(
          (prop) =>
            ts.isPropertyAssignment(prop) &&
            prop.name.getText() === "parameters"
        );
        
        if (paramsProp && ts.isPropertyAssignment(paramsProp)) {
          const initializer = paramsProp.initializer;
          if (ts.isObjectLiteralExpression(initializer)) {
            // Iterate through each parameter in the object
            for (const prop of initializer.properties) {
              if (ts.isPropertyAssignment(prop)) {
                const paramName = prop.name.getText();
                const paramValue = prop.initializer;
                
                if (ts.isObjectLiteralExpression(paramValue)) {
                  const descProp = paramValue.properties.find(
                    p => ts.isPropertyAssignment(p) && p.name.getText() === "description"
                  );
                  
                  if (descProp && ts.isPropertyAssignment(descProp) && ts.isStringLiteral(descProp.initializer)) {
                    descriptions[paramName] = {
                      description: descProp.initializer.text
                    };
                  }
                }
              }
            }
          }
        }
      }
    }
  }
  
  return descriptions;
}