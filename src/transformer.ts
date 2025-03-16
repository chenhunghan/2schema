import * as ts from "typescript";
import { getTypeInfoFromObject } from "./getTypeInfoFromObject";
import { createFunctionSchemaExpression } from "./createFunctionSchemaExpression";
import { isDecorator } from "./findDecorator";
import { getSimpleSchemaVariableStatement } from "./getSimpleSchemaVariableStatement";
import { createVariableStatement } from "./createVariableStatement";
import { createDecoratorDeclaration } from "./createDecoratorDeclaration";
import { getFunctionDescription } from "./getFunctionDescription";
import { getFunctionStrict } from "./getFunctionStrict";
import { getAdditionalProperties } from "./getAdditionalProperties";
import { getParameterDescriptions } from "./getParameterDescriptions";
import { getArraySchemaVariableStatement } from "./getArraySchemaVariableStatement";
import { getAutomate } from "./getAutomate";
import { getParser } from "./getParser";

export default function transformerProgram(program: ts.Program) {
  const typeChecker = program.getTypeChecker();

  const transformerFactory: ts.TransformerFactory<ts.SourceFile> = (
    context
  ) => {
    return (sourceFile) => {
      const schemas: ts.VariableStatement[] = [];
      const decorators: ts.FunctionDeclaration[] = [];

      const visitor = (node: ts.Node): ts.Node => {
        if (ts.isClassDeclaration(node) && node.name) {
          const newMethods = node.members.map((member) => {
            if (ts.isMethodDeclaration(member)) {
              const method = member;
              const methodName = member.name.getText();

              const fnDecorator = member.modifiers?.find((modifier) =>
                isDecorator(modifier, "fn")
              );

              // Ignore if the method does not have the `fn` decorator
              if (!fnDecorator) {
                return member;
              }

              const functionDescription = getFunctionDescription(fnDecorator);
              const automate = getAutomate(fnDecorator);
              const parser = getParser(fnDecorator);
              const strict = getFunctionStrict(fnDecorator);
              const decoratorName = `__decorate__${methodName}__json__schema`;
              const schemaName = `__${methodName}__json__schema`;
              
              // has @fn but no parameters
              if (method.parameters.length === 0 && fnDecorator) {
                const functionSchema = {
                  type: "function",
                  function: {
                    name: methodName,
                    description: functionDescription,
                    parameters: {
                      type: "object",
                      properties: {},
                      required: []
                    },
                    strict,
                  },
                };
                const functionSchemaExpression =
                createFunctionSchemaExpression(functionSchema, automate, parser);

                const schemaVariableDeclaration = createVariableStatement(
                  schemaName,
                  functionSchemaExpression
                );
  
                schemas.push(schemaVariableDeclaration);
  
                // Create the decorator function
                const decoratorFunction = createDecoratorDeclaration(
                  decoratorName,
                  schemaName
                );
  
                decorators.push(decoratorFunction);
  
                // replace the `fn` decorator with the new decorator
                const modifierWithOutFn = member.modifiers?.filter(
                  (modifier) => !isDecorator(modifier, "fn")
                );
  
                return ts.factory.updateMethodDeclaration(
                  member,
                  [
                    ts.factory.createDecorator(
                      ts.factory.createIdentifier(decoratorName)
                    ),
                    ...(modifierWithOutFn || []),
                  ],
                  member.asteriskToken,
                  member.name,
                  member.questionToken,
                  member.typeParameters,
                  member.parameters,
                  member.type,
                  member.body
                );
              }

              const paramaterDescriptions =
                getParameterDescriptions(fnDecorator);

              if (method.parameters.length === 1) {
                const parameter = method.parameters[0];
                const type = typeChecker.getTypeAtLocation(parameter);
                const typeName = typeChecker.typeToString(type);
                const typeNode = parameter.type;
                
                if (
                  typeName === "string" ||
                  typeName === "number" ||
                  typeName === "boolean" ||
                  (typeName.includes("|") &&
                    !typeName.includes("{") &&
                    !typeName.includes("Array"))
                ) {
                  schemas.push(
                    getSimpleSchemaVariableStatement(
                      typeChecker,
                      methodName,
                      functionDescription,
                      paramaterDescriptions,
                      strict,
                      parameter
                    )
                  );
                  // Create the decorator function
                  const decoratorFunction = createDecoratorDeclaration(
                    decoratorName,
                    schemaName
                  );

                  decorators.push(decoratorFunction);

                  // replace the `fn` decorator with the new decorator
                  const modifierWithOutFn = member.modifiers?.filter(
                    (modifier) => !isDecorator(modifier, "fn")
                  );

                  return ts.factory.updateMethodDeclaration(
                    member,
                    [
                      ts.factory.createDecorator(
                        ts.factory.createIdentifier(decoratorName)
                      ),
                      ...(modifierWithOutFn || []),
                    ],
                    member.asteriskToken,
                    member.name,
                    member.questionToken,
                    member.typeParameters,
                    member.parameters,
                    member.type,
                    member.body
                  );
                }

                // T[]
                if (ts.isArrayTypeNode(typeNode)) {
                  const elementTypeString = typeChecker.typeToString(
                    typeChecker.getTypeFromTypeNode(typeNode.elementType)
                  );

                  const functionSchema = getArraySchemaVariableStatement(
                    methodName,
                    functionDescription,
                    paramaterDescriptions,
                    strict,
                    parameter,
                    elementTypeString,
                    automate,
                    parser
                  );

                  schemas.push(functionSchema);

                  // Create the decorator function
                  const decoratorFunction = createDecoratorDeclaration(
                    decoratorName,
                    schemaName
                  );

                  decorators.push(decoratorFunction);

                  // replace the `fn` decorator with the new decorator
                  const modifierWithOutFn = member.modifiers?.filter(
                    (modifier) => !isDecorator(modifier, "fn")
                  );

                  return ts.factory.updateMethodDeclaration(
                    member,
                    [
                      ts.factory.createDecorator(
                        ts.factory.createIdentifier(decoratorName)
                      ),
                      ...(modifierWithOutFn || []),
                    ],
                    member.asteriskToken,
                    member.name,
                    member.questionToken,
                    member.typeParameters,
                    member.parameters,
                    member.type,
                    member.body
                  );
                }
                // Array<T>
                if (
                  typeName.includes("Array") &&
                  ts.isTypeReferenceNode(typeNode)
                ) {
                  const elementTypeString = typeChecker.typeToString(
                    typeChecker.getTypeFromTypeNode(typeNode.typeArguments![0])
                  );
                  const elementType = elementTypeString.includes("|")
                   ? elementTypeString.split("|").map((t) => t.trim())
                   : elementTypeString;

                  const functionSchema = getArraySchemaVariableStatement(
                    methodName,
                    functionDescription,
                    paramaterDescriptions,
                    strict,
                    parameter,
                    elementType,
                    automate,
                    parser
                  );

                  schemas.push(functionSchema);

                  // Create the decorator function
                  const decoratorFunction = createDecoratorDeclaration(
                    decoratorName,
                    schemaName
                  );

                  decorators.push(decoratorFunction);

                  // replace the `fn` decorator with the new decorator
                  const modifierWithOutFn = member.modifiers?.filter(
                    (modifier) => !isDecorator(modifier, "fn")
                  );

                  return ts.factory.updateMethodDeclaration(
                    member,
                    [
                      ts.factory.createDecorator(
                        ts.factory.createIdentifier(decoratorName)
                      ),
                      ...(modifierWithOutFn || []),
                    ],
                    member.asteriskToken,
                    member.name,
                    member.questionToken,
                    member.typeParameters,
                    member.parameters,
                    member.type,
                    member.body
                  );
                }
              }

              const additionalProperties = getAdditionalProperties(fnDecorator);

              const functionSchema = {
                type: "function",
                function: {
                  name: methodName,
                  description: functionDescription,
                  parameters: {
                    type: "object",
                    properties: {},
                    required: [] as String[],
                    additionalProperties,
                  },
                  strict,
                },
              };

              for (const parameter of method.parameters) {
                const parameterType = typeChecker.getTypeAtLocation(parameter);
                const parameterTypeInfo = getTypeInfoFromObject(
                  parameterType,
                  typeChecker
                );
                for (const parameterPropertyKey of Object.keys(
                  parameterTypeInfo
                )) {
                  const parameterType = parameterTypeInfo[parameterPropertyKey];

                  functionSchema.function.parameters.properties[
                    parameterPropertyKey
                  ] = {
                    // if the type is a union type, split it into an array
                    type: parameterType?.includes?.("|")
                      ? parameterType
                          ?.split("|")
                          .map((t) => t.trim())
                      : (
                        parameterType?.type === "array" ? parameterType?.type : parameterType
                      ),
                    description:
                    parameterType
                        ?.description ?? "",
                    ...{ ...(parameterType?.type === "array" ? { items: parameterType?.items } : {})}
                  };
                  functionSchema.function.parameters.required.push(
                    parameterPropertyKey
                  );
                }
              }

              const functionSchemaExpression =
                createFunctionSchemaExpression(functionSchema, automate, parser);

              const schemaVariableDeclaration = createVariableStatement(
                schemaName,
                functionSchemaExpression
              );

              schemas.push(schemaVariableDeclaration);

              // Create the decorator function
              const decoratorFunction = createDecoratorDeclaration(
                decoratorName,
                schemaName
              );

              decorators.push(decoratorFunction);

              // replace the `fn` decorator with the new decorator
              const modifierWithOutFn = member.modifiers?.filter(
                (modifier) => !isDecorator(modifier, "fn")
              );

              return ts.factory.updateMethodDeclaration(
                member,
                [
                  ts.factory.createDecorator(
                    ts.factory.createIdentifier(decoratorName)
                  ),
                  ...(modifierWithOutFn || []),
                ],
                member.asteriskToken,
                member.name,
                member.questionToken,
                member.typeParameters,
                member.parameters,
                member.type,
                member.body
              );
            }
            return member;
          });

          return ts.factory.updateClassDeclaration(
            node,
            node.modifiers,
            node.name,
            node.typeParameters,
            node.heritageClauses,
            newMethods
          );
        }
        return node;
      };

      const transformedSourceFile = ts.visitEachChild(
        sourceFile,
        visitor,
        context
      );

      // Find the index of the import (require) statement
      const importIndex = transformedSourceFile.statements.findIndex(
        (statement) => ts.isImportDeclaration(statement)
      );

      // Insert decorator function after import (require)
      const newStatements = [...transformedSourceFile.statements];
      newStatements.splice(importIndex + 1, 0, ...schemas, ...decorators);

      // Update source file with new statements
      const updatedSourceFile = ts.factory.updateSourceFile(
        transformedSourceFile,
        newStatements
      );

      return ts.visitNode(updatedSourceFile, visitor, ts.isSourceFile);
    };
  };

  return transformerFactory;
}
