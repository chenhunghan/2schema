import * as ts from "typescript";
import { createVariableStatement } from "./createVariableStatement";
import { createArrayFunctionSchemaExpression } from "./createArrayFunctionSchemaExpression";

export function getArraySchemaVariableStatement(
  methodName: string,
  methodDescription: string,
  parameterDescriptions: {
    [key: string]: Record<string, string>;
  },
  strict: boolean,
  parameter: ts.ParameterDeclaration,
  elementTypeString: string | string[],
  automated: boolean,
  parser: string
) {
  const schemaVariableName = `__${methodName}__json__schema`;
  // item is union type
  if (Array.isArray(elementTypeString)) {
    const functionSchema = {
      type: "function",
      function: {
        name: methodName,
        description: methodDescription,
        strict,
        parameters: [
          {
            name: parameter.name.getText(),
            type: "array",
            description:
              parameterDescriptions[parameter.name.getText()]?.description ??
              "",
            items: {
              oneOf: elementTypeString.map((type) => ({
                type,
              })),
            },
          },
        ],
      },
    };

    return schemaToDeclaration(schemaVariableName, functionSchema, automated, parser);
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
          type: "array",
          description:
            parameterDescriptions[parameter.name.getText()]?.description ?? "",
          items: {
            type: elementTypeString,
          },
        },
      ],
    },
  };

  return schemaToDeclaration(
    schemaVariableName,
    functionSchema,
    automated,
    parser
  );
}

function schemaToDeclaration(
  schemaVariableName: string,
  functionSchema: any,
  automated: boolean,
  parser: string
) {
  const functionSchemaExpression = createArrayFunctionSchemaExpression(
    functionSchema,
    automated,
    parser
  );

  const functionSchemaVariableDeclaration = createVariableStatement(
    schemaVariableName,
    functionSchemaExpression
  );

  return functionSchemaVariableDeclaration;
}
