import * as ts from "typescript";
import { getTypeInfoFromObject } from "./src/getTypeInfoFromObject";
import { createFunctionSchemaExpression } from "./src/createFunctionSchemaExpression";
import { isDecorator } from "./src/findDecorator";
import { getSimpleSchemaVariableStatement } from "./src/getSimpleSchemaVariableStatement";
import { createVariableStatement } from "./src/createVariableStatement";
import { createDecoratorDeclaration } from "./src/createDecoratorDeclaration";
import { getFunctionDescription } from "./src/getFunctionDescription";
import { getFunctionStrict } from "./src/getFunctionStrict";
import { getAdditionalProperties } from "./src/getAdditionalProperties";
import { getParameterDescriptions } from "./src/getParameterDescriptions";
import { getArraySchemaVariableStatement } from "./src/getArraySchemaVariableStatement";
import { getAutomate } from "./src/getAutomate";
import { getParser } from "./src/getParser";

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
            const className = node.name.getText();
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
                createFunctionSchemaExpression(functionSchema, className, automate, parser);

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

              const parameterDescriptions = 
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
                      parameterDescriptions, 
                      strict,
                      parameter,
                      className,
                      automate,
                      parser
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
                    methodName, // Reverted debug change
                    functionDescription,
                    parameterDescriptions,
                    // REMOVED extra parameterDescriptions
                    strict,
                    parameter,
                    elementTypeString,
                    className,
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
                    methodName, // Reverted debug change
                    functionDescription,
                    parameterDescriptions,
                    // REMOVED extra parameterDescriptions
                    strict,
                    parameter,
                    elementType,
                    className,
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
                // Pass parameterDescriptions to getTypeInfoFromObject
                // For the top-level parameter itself, its name is parameter.name.getText()
                // However, getTypeInfoFromObject is designed to find descriptions for *properties within* this parameter if it's an object.
                // So, we pass the full parameterDescriptions map. getTypeInfoFromObject will use the 'propertyName' argument
                // during its recursive calls for object properties.
                const rawParameterTypeInfo = getTypeInfoFromObject(
                  parameterType,
                  typeChecker,
                  parameterDescriptions, 
                  parameter.name.getText() 
                );

                // Ensure rawParameterTypeInfo is in the expected { type: "object", properties: {}, ... } format
                const parameterSchema = (typeof rawParameterTypeInfo === 'string') 
                  ? { type: rawParameterTypeInfo, properties: {}, required: [] } // Should not happen for objects
                  : rawParameterTypeInfo;

                if (parameterSchema.type === "object" && parameterSchema.properties) {
                  for (const parameterPropertyKey of Object.keys(
                    parameterSchema.properties
                  )) {
                    const propertyDetails =
                      parameterSchema.properties[parameterPropertyKey];
                    
                    // Construct the schema for the individual property
                    // propertyDetails is already a schema object from getTypeInfoFromObject
                    functionSchema.function.parameters.properties[parameterPropertyKey] = propertyDetails;
                  }
                  // Add required properties from the parameter's schema
                  if (parameterSchema.required) {
                    functionSchema.function.parameters.required.push(...parameterSchema.required);
                  }
                } else if (typeof parameterSchema === 'string' || (parameterSchema.type && typeof parameterSchema.type === 'string' && !parameterSchema.properties)) {
                  // Handle cases where the parameter itself is a simple type (e.g. a top-level string, number)
                  // This path should ideally not be hit if parameters are always objects/interfaces
                  // or if simple parameters are handled by getSimpleSchemaVariableStatement exclusively.
                  // However, as a fallback:
                  const paramName = parameter.name.getText();
                   functionSchema.function.parameters.properties[paramName] = {
                       type: typeof parameterSchema === 'string' ? parameterSchema : parameterSchema.type,
                       description: "" // No description available here
                   };
                   functionSchema.function.parameters.required.push(paramName);
                }
              }

              const functionSchemaExpression =
                createFunctionSchemaExpression(functionSchema, className, automate, parser);

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
