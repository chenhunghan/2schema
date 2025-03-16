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
  // union type with |
  const types = typeName.split("|").map((t) => t.trim());

  if (types.length > 1) {
    const functionSchema = {
      type: "function",
      function: {
        name: methodName,
        description: methodDescription,
        strict,
        parameters: [
          {
            name: parameter.name.getText(),
            type: types,
            description:
              parameterDescriptions[parameter.name.getText()]?.description ??
              "",
          },
        ],
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

  const functionSchema = {
    type: "function",
    function: {
      name: methodName,
      description: methodDescription,
      strict,
      parameters: [
        {
          name: parameter.name.getText(),
          type: typeName,
          description:
            parameterDescriptions[parameter.name.getText()]?.description ?? "",
        },
      ],
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
