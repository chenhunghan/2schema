import * as ts from "typescript";
import { createSimpleFunctionSchemaExpression } from "./createSimpleFunctionSchemaExpression";
import { createVariableStatement } from "./createVariableStatement";

export function getSimpleSchemaVariableStatement(
  typeChecker: ts.TypeChecker,
  methodName: string,
  methodDescription: string,
  parameterDescriptions: {
    [key: string]: Record<string, string>;
  },
  strict: boolean,
  parameter: ts.ParameterDeclaration,
  className: string,
  automate: boolean,
  parser: string
) {
  const typeName = typeChecker.typeToString(
    typeChecker.getTypeAtLocation(parameter)
  );
  const parameterName = parameter.name.getText();
  const parameterDescription =
    parameterDescriptions[parameterName]?.description ?? "";

  // union type with |
  const types = typeName.split("|").map((t) => t.trim());

  const functionSchema = {
    type: "function",
    function: {
      name: methodName,
      description: methodDescription,
      strict,
      parameters: {
        type: "object",
        properties: {
          [parameterName]: {
            type: types.length > 1 ? types : typeName,
            description: parameterDescription,
          },
        },
        required: [parameterName],
      },
    },
  };

  const functionSchemaExpression =
    createSimpleFunctionSchemaExpression(functionSchema, className, automate, parser);

  const schemaVariableName = `__${methodName}__json__schema`;

  const functionSchemaVariableDeclaration = createVariableStatement(
    schemaVariableName,
    functionSchemaExpression
  );

  return functionSchemaVariableDeclaration;
}
