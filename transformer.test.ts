import { test, expect, describe } from "vitest";
import * as ts from "typescript";
import * as vm from "node:vm";
import transformer from "./transformer";

// Existing transform function used by snapshot tests
const transform = (code: string) => {
  const sourceFile = ts.createSourceFile(
    "test.ts",
    code,
    ts.ScriptTarget.Latest,
    true
  );

  const program = ts.createProgram({
    rootNames: ["test.ts"],
    options: {
      target: ts.ScriptTarget.ESNext,
      module: ts.ModuleKind.CommonJS,
      experimentalDecorators: true, // Added for consistency, though may not affect this transform much
    },
    host: {
      getSourceFile: (fileName) => (fileName === "test.ts" ? sourceFile : undefined),
      getDefaultLibFileName: () => "lib.d.ts",
      writeFile: () => {},
      getCurrentDirectory: () => "",
      getCanonicalFileName: (f) => f,
      useCaseSensitiveFileNames: () => true,
      getNewLine: () => "\n",
      fileExists: (fileName) => fileName === "test.ts" || fileName === "lib.d.ts",
      readFile: (fileName) => (fileName === "test.ts" ? code : ""),
      directoryExists: () => true,
      getDirectories: () => [],
    },
  });

  const result = ts.transform(sourceFile, [transformer(program)]);
  const printer = ts.createPrinter();
  return printer.printFile(result.transformed[0]);
};


describe("transformer", async () => {
  // describe("can parse function with a simple parameter", async () => { // Keep existing tests
    // ... existing tests ...
  // });

  // describe("can parse function with an object parameter", async () => { // Keep existing tests
    // ... existing tests ...
  // });

  // test("handles 2+ decorators", async () => { // Keep existing tests
    // ... existing tests ...
  // });
  
  // test("if the method doesn't have any parameters, just return schema", async () => { // Keep existing tests
    // ... existing tests ...
  // });

  // test("skips if the method doesn't have the fn decorator", async () => { // Keep existing tests
    // ... existing tests ...
  // });

  describe("toJSONSchema runtime behavior", () => {
    // Helper function to transform TS code (with custom transformer) and then transpile to JS
    const transformAndTranspile = (tsCode: string) => {
      const sourceFile = ts.createSourceFile(
        "test.ts",
        tsCode,
        ts.ScriptTarget.Latest,
        true
      );

      // Create a program to use the type checker and apply transformers
      const program = ts.createProgram({
        rootNames: ["test.ts"],
        options: {
          target: ts.ScriptTarget.ES2020, // Target for JS output
          module: ts.ModuleKind.CommonJS,
          experimentalDecorators: true,     // Enable decorators
        },
        host: {
          getSourceFile: (fileName) => (fileName === "test.ts" ? sourceFile : undefined),
          getDefaultLibFileName: () => "lib.d.ts",
          writeFile: () => {},
          getCurrentDirectory: () => "",
          getCanonicalFileName: (f) => f,
          useCaseSensitiveFileNames: () => true,
          getNewLine: () => "\n",
          fileExists: (fileName) => fileName === "test.ts" || fileName === "lib.d.ts",
          readFile: (fileName) => (fileName === "test.ts" ? tsCode : ""),
          directoryExists: () => true,
          getDirectories: () => [],
        },
      });

      // Apply the custom transformer
      const { transformed } = ts.transform(sourceFile, [transformer(program)]);
      const printer = ts.createPrinter();
      const transformedTsCode = printer.printFile(transformed[0]);

      // Transpile the transformed TS code (which now includes __decorate calls) to JS
      const jsOutput = ts.transpileModule(transformedTsCode, {
        compilerOptions: {
          module: ts.ModuleKind.CommonJS,
          target: ts.ScriptTarget.ES2020,
          experimentalDecorators: true, // Ensure decorators are processed by transpileModule
        },
      });
      return jsOutput.outputText;
    };

    test("decorated method should have toJSONSchema that returns the correct schema", () => {
      const rawTsCode = `
// Dummy @fn decorator for the transformer to find and replace.
// It's not used at runtime by the final decorated method's toJSONSchema.
const fn = (options?: any) => (target: any, context: any) => { /* replaced by transformer */ };

export class TestToolsWithToJSON { // Added export to make it a module accessible via context.module.exports
  @fn({ description: "A method for testing toJSONSchema" })
  static testMethodForToJSON(paramStr: string): boolean {
    return paramStr === "hello";
  }
}
`;
      const executableJsCode = transformAndTranspile(rawTsCode);
      
      const contextExports: any = {};
      const context = {
        exports: contextExports,
        module: { exports: contextExports },
        require: require, // Provide require for CommonJS modules if needed by transpiled code
        console: console, // For debugging from within vm if necessary
      };
      vm.createContext(context);
      
      // Append code to capture the globally defined schema variable
      // The schema variable name is predictable: __<methodName>__json__schema
      const finalJsCodeToRun = executableJsCode + 
        `\nexports.__schemaVariable = (typeof __testMethodForToJSON__json__schema !== 'undefined') ? __testMethodForToJSON__json__schema : undefined;`;

      const script = new vm.Script(finalJsCodeToRun);
      script.runInContext(context);
      
      const MyTestClass = context.module.exports.TestToolsWithToJSON;
      const schemaVariableFromScript = context.exports.__schemaVariable;

      expect(MyTestClass).toBeDefined();
      const testMethod = MyTestClass.testMethodForToJSON;
      expect(testMethod).toBeDefined();
      expect(typeof testMethod.toJSONSchema).toBe('function');

      const schemaFromMethod = testMethod.toJSONSchema();
      expect(schemaFromMethod).toBeDefined();
      
      // Verify against the captured schema variable
      expect(schemaVariableFromScript).toBeDefined();
      expect(schemaFromMethod).toEqual(schemaVariableFromScript);

      // Sanity check specific parts of the schema
      expect(schemaFromMethod.type).toBe("function");
      expect(schemaFromMethod.function).toBeDefined();
      expect(schemaFromMethod.function.name).toBe("testMethodForToJSON");
      expect(schemaFromMethod.function.description).toBe("A method for testing toJSONSchema");
      expect(schemaFromMethod.function.parameters).toBeDefined();
      expect(schemaFromMethod.function.parameters.type).toBe("object");
      expect(schemaFromMethod.function.parameters.properties.paramStr.type).toBe("string");
      expect(schemaFromMethod.function.parameters.required).toEqual(["paramStr"]);
    });
  });
// Note: The initial describe block should be closed after all test suites.
// If the original file structure was `describe("transformer", ...)` wrapping everything,
// this new `describe("toJSONSchema runtime behavior", ...)` should be inside it.
// The diff tool might place this incorrectly if the search block is too broad.
// Assuming the outer describe("transformer", ...) is already present and correctly closed.
});

// New test suite for toJSONSchema runtime behavior
describe("toJSONSchema runtime behavior", () => {
  // Helper function to transform TS code (with custom transformer) and then transpile to JS
  const transformAndTranspile = (tsCode: string) => {
    const sourceFile = ts.createSourceFile(
      "test.ts", // Filename for the source file
      tsCode,
      ts.ScriptTarget.Latest,
      true
    );

    // Create a program to use the type checker and apply transformers
    // The host setup needs to be robust enough for the type checker to work.
    const program = ts.createProgram({
      rootNames: ["test.ts"],
      options: {
        target: ts.ScriptTarget.ES2020,     // Target for JS output
        module: ts.ModuleKind.CommonJS,   // Module system for output
        experimentalDecorators: true,     // Enable decorators
        emitDecoratorMetadata: false,     // Not strictly needed for this transformer
      },
      host: {
        getSourceFile: (fileName) => (fileName === "test.ts" ? sourceFile : undefined),
        getDefaultLibFileName: () => "lib.d.ts", // Provide a default lib for basic types
        writeFile: () => {},
        getCurrentDirectory: () => "",
        getCanonicalFileName: (f) => f,
        useCaseSensitiveFileNames: () => true,
        getNewLine: () => "\n",
        fileExists: (fileName) => fileName === "test.ts" || fileName === "lib.d.ts", // Acknowledge lib.d.ts
        readFile: (fileName) => (fileName === "test.ts" ? tsCode : ""),
        directoryExists: () => true,
        getDirectories: () => [],
      },
    });

    // Apply the custom transformer
    const { transformed } = ts.transform(sourceFile, [transformer(program)]);
    const printer = ts.createPrinter();
    // This is still TypeScript code, but with our transformer's changes (e.g., __decorate_ functions)
    const transformedTsCode = printer.printFile(transformed[0]);

    // Transpile the transformed TS code to JS
    const jsOutput = ts.transpileModule(transformedTsCode, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
        experimentalDecorators: true,
      },
    });
    return jsOutput.outputText;
  };

  test("decorated method should have toJSONSchema that returns the correct schema", () => {
    const rawTsCode = `
// This 'fn' is a placeholder for the transformer. 
// The actual decorator logic is applied by the transformer's generated __decorate__ function.
const fn = (options?: any) => (target: any, context: any) => { /* transformer replaces this */ };

// Export the class to make it accessible via module.exports in the vm context
export class TestToolsForToJSONSchema { 
  @fn({ description: "A test method for toJSONSchema functionality." })
  static aTestMethod(textParam: string, numParam: number): boolean {
    return textParam === "test" && numParam === 123;
  }
}
`;
    const executableJsCode = transformAndTranspile(rawTsCode);
    
    const contextExports: any = {};
    const context = {
      exports: contextExports,
      module: { exports: contextExports },
      require: require, // Provide require for CommonJS modules if needed by transpiled code
      // console: console, // For debugging from within vm
    };
    vm.createContext(context);
    
    // Append code to capture the globally defined schema variable into exports
    // The schema variable name is predictable: __<methodName>__json__schema
    const finalJsCodeToRun = executableJsCode + 
      `\nif (typeof __aTestMethod__json__schema !== 'undefined') { exports.__schemaVariableForTest = __aTestMethod__json__schema; } else { exports.__schemaVariableForTest = undefined; }`;

    const script = new vm.Script(finalJsCodeToRun);
    script.runInContext(context);
    
    const MyTestClass = context.module.exports.TestToolsForToJSONSchema;
    const schemaVariableFromScript = context.exports.__schemaVariableForTest;

    expect(MyTestClass).toBeDefined();
    const testMethod = MyTestClass.aTestMethod;
    expect(testMethod).toBeDefined();
    
    expect(typeof testMethod.toJSONSchema).toBe('function');

    const schemaFromMethod = testMethod.toJSONSchema();
    expect(schemaFromMethod).toBeDefined();
    
    // Verify against the captured schema variable
    expect(schemaVariableFromScript).toBeDefined(); // Ensure the schema variable was captured
    expect(schemaFromMethod).toEqual(schemaVariableFromScript);

    // Sanity check specific parts of the schema from toJSONSchema()
    expect(schemaFromMethod.type).toBe("function");
    expect(schemaFromMethod.function).toBeDefined();
    expect(schemaFromMethod.function.name).toBe("aTestMethod");
    expect(schemaFromMethod.function.description).toBe("A test method for toJSONSchema functionality.");
    expect(schemaFromMethod.function.parameters).toBeDefined();
    expect(schemaFromMethod.function.parameters.type).toBe("object");
    expect(schemaFromMethod.function.parameters.properties.textParam.type).toBe("string");
    expect(schemaFromMethod.function.parameters.properties.numParam.type).toBe("number");
    expect(schemaFromMethod.function.parameters.required).toEqual(["textParam", "numParam"]);
  });

  // Test suite for toJSONSchema runtime behavior was already added in a previous subtask.
  // This will add a new test case to it, or ensure the existing one is robust.
  // Assuming the 'transformAndTranspile' helper and the suite 'describe("toJSONSchema runtime behavior", ...)'
  // are already present from the previous (rolled-back) attempt.
  // If not, the following code implicitly re-adds/defines it.

  describe("toJSONSchema runtime behavior", () => {
    // Helper function to transform TS code (with custom transformer) and then transpile to JS
    // This helper should be nearly identical to the one successfully used in the previous subtask's final state.
    const transformAndTranspile = (tsCode: string) => {
      const sourceFile = ts.createSourceFile(
        "test.ts",
        tsCode,
        ts.ScriptTarget.Latest,
        true
      );

      const program = ts.createProgram({
        rootNames: ["test.ts"],
        options: {
          target: ts.ScriptTarget.ES2020,
          module: ts.ModuleKind.CommonJS,
          experimentalDecorators: true,
          emitDecoratorMetadata: false, 
        },
        host: {
          getSourceFile: (fileName) => (fileName === "test.ts" ? sourceFile : undefined),
          getDefaultLibFileName: () => "lib.d.ts",
          writeFile: () => {},
          getCurrentDirectory: () => "",
          getCanonicalFileName: (f) => f,
          useCaseSensitiveFileNames: () => true,
          getNewLine: () => "\n",
          fileExists: (fileName) => fileName === "test.ts" || fileName === "lib.d.ts",
          readFile: (fileName) => (fileName === "test.ts" ? tsCode : ""),
          directoryExists: () => true,
          getDirectories: () => [],
        },
      });

      const { transformed } = ts.transform(sourceFile, [transformer(program)]);
      const printer = ts.createPrinter();
      const transformedTsCode = printer.printFile(transformed[0]);

      const jsOutput = ts.transpileModule(transformedTsCode, {
        compilerOptions: {
          module: ts.ModuleKind.CommonJS,
          target: ts.ScriptTarget.ES2020,
          experimentalDecorators: true,
        },
      });
      return jsOutput.outputText;
    };

    test("decorated method should have toJSONSchema that returns the correct schema", () => {
      const rawTsCode = `
// Dummy fn for transformer processing
const fn = (options?: any) => (target: any, context: any) => {};

export class MyToolsForJSONSchemaTest { 
  @fn({ description: "A test method for toJSONSchema" })
  static aTestMethod(textParam: string, numParam: number): boolean {
    return textParam === "test" && numParam === 123;
  }
}
`;
      const executableJsCode = transformAndTranspile(rawTsCode);
      
      const contextExports: any = {};
      const context = {
        exports: contextExports,
        module: { exports: contextExports },
        require: require, 
        // console: console, 
      };
      vm.createContext(context);
      
      const finalJsCodeToRun = executableJsCode + 
        `\nif (typeof __aTestMethod__json__schema !== 'undefined') { exports.__schemaVariableForTest = __aTestMethod__json__schema; } else { exports.__schemaVariableForTest = undefined; }`;

      const script = new vm.Script(finalJsCodeToRun);
      script.runInContext(context);
      
      const TestClass = context.module.exports.MyToolsForJSONSchemaTest;
      const schemaVariable = context.exports.__schemaVariableForTest;

      expect(TestClass).toBeDefined();
      const methodWithSchema = TestClass.aTestMethod;
      expect(methodWithSchema).toBeDefined();
      
      expect(typeof methodWithSchema.toJSONSchema).toBe('function');

      const schemaReturnedByMethod = methodWithSchema.toJSONSchema();
      expect(schemaReturnedByMethod).toBeDefined();
      
      expect(schemaVariable).toBeDefined();
      expect(schemaReturnedByMethod).toEqual(schemaVariable);

      // Further sanity checks on the schema content
      expect(schemaReturnedByMethod.type).toBe("function");
      expect(schemaReturnedByMethod.function).toBeDefined();
      expect(schemaReturnedByMethod.function.name).toBe("aTestMethod");
      expect(schemaReturnedByMethod.function.description).toBe("A test method for toJSONSchema");
      expect(schemaReturnedByMethod.function.parameters).toBeDefined();
      expect(schemaReturnedByMethod.function.parameters.type).toBe("object");
      expect(schemaReturnedByMethod.function.parameters.properties.textParam.type).toBe("string");
      expect(schemaReturnedByMethod.function.parameters.properties.numParam.type).toBe("number");
      expect(schemaReturnedByMethod.function.parameters.required).toEqual(["textParam", "numParam"]);
    });
  });
});
        const sourceFile = ts.createSourceFile(
          "",
          code,
          ts.ScriptTarget.Latest,
          true
        );

        const program = ts.createProgram({
          rootNames: ["test.ts"],
          options: {
            target: ts.ScriptTarget.ESNext,
            module: ts.ModuleKind.CommonJS,
          },
          host: {
            getSourceFile: () => sourceFile,
            getDefaultLibFileName: () => "lib.d.ts",
            writeFile: () => {},
            getCurrentDirectory: () => "",
            getCanonicalFileName: (f) => f,
            useCaseSensitiveFileNames: () => true,
            getNewLine: () => "\n",
            fileExists: () => true,
            readFile: () => "",
            directoryExists: () => true,
            getDirectories: () => [],
          },
        });

        const result = ts.transform(sourceFile, [transformer(program)]);
        return ts.createPrinter().printFile(result.transformed[0]);
      };
      const code = `
      class Tools {
        @fn
        static example(abc: string): string {
          return "";
        }
      }
      `;

      expect(transform(code)).toMatchInlineSnapshot(`
        "const __example__json__schema = {
            type: "function",
            function: { name: "example", description: "", strict: true, parameters: {
                    type: "object",
                    properties: {
                        "abc": { type: "string", description: "" }
                    },
                    required: ["abc"]
                } }
        };
        function __decorate__example__json__schema(target, context) {
            function method(...args) { return target.call(this, ...args); }
            method.toJSONSchema = () => __example__json__schema;
            return method;
        }
        class Tools {
            @__decorate__example__json__schema
            static example(abc: string): string {
                return "";
            }
        }
        "
      `);
    });

    test("when parameter is a number", async () => {
      // Transformer setup (for testing)
      const transform = (code: string) => {
        const sourceFile = ts.createSourceFile(
          "",
          code,
          ts.ScriptTarget.Latest,
          true
        );

        const program = ts.createProgram({
          rootNames: ["test.ts"],
          options: {
            target: ts.ScriptTarget.ESNext,
            module: ts.ModuleKind.CommonJS,
          },
          host: {
            getSourceFile: () => sourceFile,
            getDefaultLibFileName: () => "lib.d.ts",
            writeFile: () => {},
            getCurrentDirectory: () => "",
            getCanonicalFileName: (f) => f,
            useCaseSensitiveFileNames: () => true,
            getNewLine: () => "\n",
            fileExists: () => true,
            readFile: () => "",
            directoryExists: () => true,
            getDirectories: () => [],
          },
        });

        const result = ts.transform(sourceFile, [transformer(program)]);
        return ts.createPrinter().printFile(result.transformed[0]);
      };
      const code = `
      class Tools {
        @fn
        static example(abc: number): string {
          return "";
        }
      }
      `;

      expect(transform(code)).toMatchInlineSnapshot(`
        "const __example__json__schema = {
            type: "function",
            function: { name: "example", description: "", strict: true, parameters: {
                    type: "object",
                    properties: {
                        "abc": { type: "number", description: "" }
                    },
                    required: ["abc"]
                } }
        };
        function __decorate__example__json__schema(target, context) {
            function method(...args) { return target.call(this, ...args); }
            method.toJSONSchema = () => __example__json__schema;
            return method;
        }
        class Tools {
            @__decorate__example__json__schema
            static example(abc: number): string {
                return "";
            }
        }
        "
      `);
    });

    test("when parameter is a boolean", async () => {
      // Transformer setup (for testing)
      const transform = (code: string) => {
        const sourceFile = ts.createSourceFile(
          "",
          code,
          ts.ScriptTarget.Latest,
          true
        );

        const program = ts.createProgram({
          rootNames: ["test.ts"],
          options: {
            target: ts.ScriptTarget.ESNext,
            module: ts.ModuleKind.CommonJS,
          },
          host: {
            getSourceFile: () => sourceFile,
            getDefaultLibFileName: () => "lib.d.ts",
            writeFile: () => {},
            getCurrentDirectory: () => "",
            getCanonicalFileName: (f) => f,
            useCaseSensitiveFileNames: () => true,
            getNewLine: () => "\n",
            fileExists: () => true,
            readFile: () => "",
            directoryExists: () => true,
            getDirectories: () => [],
          },
        });

        const result = ts.transform(sourceFile, [transformer(program)]);
        return ts.createPrinter().printFile(result.transformed[0]);
      };
      const code = `
      class Tools {
        @fn
        static example(abc: boolean): string {
          return "";
        }
      }
      `;

      expect(transform(code)).toMatchInlineSnapshot(`
        "const __example__json__schema = {
            type: "function",
            function: { name: "example", description: "", strict: true, parameters: {
                    type: "object",
                    properties: {
                        "abc": { type: "boolean", description: "" }
                    },
                    required: ["abc"]
                } }
        };
        function __decorate__example__json__schema(target, context) {
            function method(...args) { return target.call(this, ...args); }
            method.toJSONSchema = () => __example__json__schema;
            return method;
        }
        class Tools {
            @__decorate__example__json__schema
            static example(abc: boolean): string {
                return "";
            }
        }
        "
      `);
    });

    test("when parameter is a number | null union", async () => {
      // Transformer setup (for testing)
      const transform = (code: string) => {
        const sourceFile = ts.createSourceFile(
          "",
          code,
          ts.ScriptTarget.Latest,
          true
        );

        const program = ts.createProgram({
          rootNames: ["test.ts"],
          options: {
            target: ts.ScriptTarget.ESNext,
            module: ts.ModuleKind.CommonJS,
            strict: true, // Add this
            strictNullChecks: true, // Add this - important for null unions
          },
          host: {
            getSourceFile: (fileName) => {
              if (fileName === "test.ts") {
                return sourceFile;
              }
              return undefined;
            },
            getDefaultLibFileName: () => "lib.d.ts",
            writeFile: () => {},
            getCurrentDirectory: () => "",
            getCanonicalFileName: (f) => f,
            useCaseSensitiveFileNames: () => true,
            getNewLine: () => "\n",
            fileExists: (fileName) => fileName === "test.ts",
            readFile: () => "",
            directoryExists: () => true,
            getDirectories: () => [],
          },
        });

        const result = ts.transform(sourceFile, [transformer(program)]);
        return ts.createPrinter().printFile(result.transformed[0]);
      };
      const code = `
      class Tools {
        @fn
        static example(abc: string | null): string {
          return "";
        }
      }
      `;

      expect(transform(code)).toMatchInlineSnapshot(`
        "const __example__json__schema = {
            type: "function",
            function: { name: "example", description: "", strict: true, parameters: {
                    type: "object",
                    properties: {
                        "abc": { type: ["string", "null"], description: "" }
                    },
                    required: ["abc"]
                } }
        };
        function __decorate__example__json__schema(target, context) {
            function method(...args) { return target.call(this, ...args); }
            method.toJSONSchema = () => __example__json__schema;
            return method;
        }
        class Tools {
            @__decorate__example__json__schema
            static example(abc: string | null): string {
                return "";
            }
        }
        "
      `);
    });

    test("when parameter is a number | string | null union", async () => {
      // Transformer setup (for testing)
      const transform = (code: string) => {
        const sourceFile = ts.createSourceFile(
          "",
          code,
          ts.ScriptTarget.Latest,
          true
        );

        const program = ts.createProgram({
          rootNames: ["test.ts"],
          options: {
            target: ts.ScriptTarget.ESNext,
            module: ts.ModuleKind.CommonJS,
            strict: true, // Add this
            strictNullChecks: true, // Add this - important for null unions
          },
          host: {
            getSourceFile: (fileName) => {
              if (fileName === "test.ts") {
                return sourceFile;
              }
              return undefined;
            },
            getDefaultLibFileName: () => "lib.d.ts",
            writeFile: () => {},
            getCurrentDirectory: () => "",
            getCanonicalFileName: (f) => f,
            useCaseSensitiveFileNames: () => true,
            getNewLine: () => "\n",
            fileExists: (fileName) => fileName === "test.ts",
            readFile: () => "",
            directoryExists: () => true,
            getDirectories: () => [],
          },
        });

        const result = ts.transform(sourceFile, [transformer(program)]);
        return ts.createPrinter().printFile(result.transformed[0]);
      };
      const code = `
      class Tools {
        @fn
        static example(abc: number | string | null): string {
          return "";
        }
      }
      `;

      expect(transform(code)).toMatchInlineSnapshot(`
        "const __example__json__schema = {
            type: "function",
            function: { name: "example", description: "", strict: true, parameters: {
                    type: "object",
                    properties: {
                        "abc": { type: ["string", "number", "null"], description: "" }
                    },
                    required: ["abc"]
                } }
        };
        function __decorate__example__json__schema(target, context) {
            function method(...args) { return target.call(this, ...args); }
            method.toJSONSchema = () => __example__json__schema;
            return method;
        }
        class Tools {
            @__decorate__example__json__schema
            static example(abc: number | string | null): string {
                return "";
            }
        }
        "
      `);
    });

    test("when parameter is an array Array<T>", async () => {
      // Transformer setup (for testing)
      const transform = (code: string) => {
        const sourceFile = ts.createSourceFile(
          "",
          code,
          ts.ScriptTarget.Latest,
          true
        );

        const program = ts.createProgram({
          rootNames: ["test.ts"],
          options: {
            target: ts.ScriptTarget.ESNext,
            module: ts.ModuleKind.CommonJS,
            strict: true, // Add this
            strictNullChecks: true, // Add this - important for null unions
          },
          host: {
            getSourceFile: (fileName) => {
              if (fileName === "test.ts") {
                return sourceFile;
              }
              return undefined;
            },
            getDefaultLibFileName: () => "lib.d.ts",
            writeFile: () => {},
            getCurrentDirectory: () => "",
            getCanonicalFileName: (f) => f,
            useCaseSensitiveFileNames: () => true,
            getNewLine: () => "\n",
            fileExists: (fileName) => fileName === "test.ts",
            readFile: () => "",
            directoryExists: () => true,
            getDirectories: () => [],
          },
        });

        const result = ts.transform(sourceFile, [transformer(program)]);
        return ts.createPrinter().printFile(result.transformed[0]);
      };
      const code = `
      class Tools {
        @fn
        static example(abc: Array<string>): string {
          return "";
        }
      }
      `;

      expect(transform(code)).toMatchInlineSnapshot(`
        "const __example__json__schema = {
            type: "function",
            function: { name: "example", description: "", strict: true, parameters: { name: "abc", type: "array", description: "", items: { type: "string" } } }
        };
        function __decorate__example__json__schema(target, context) {
            function method(...args) { return target.call(this, ...args); }
            method.toJSONSchema = () => __example__json__schema;
            return method;
        }
        class Tools {
            @__decorate__example__json__schema
            static example(abc: Array<string>): string {
                return "";
            }
        }
        "
      `);
    });

    test("when parameter is an array number[]", async () => {
      // Transformer setup (for testing)
      const transform = (code: string) => {
        const sourceFile = ts.createSourceFile(
          "",
          code,
          ts.ScriptTarget.Latest,
          true
        );

        const program = ts.createProgram({
          rootNames: ["test.ts"],
          options: {
            target: ts.ScriptTarget.ESNext,
            module: ts.ModuleKind.CommonJS,
            strict: true, // Add this
            strictNullChecks: true, // Add this - important for null unions
          },
          host: {
            getSourceFile: (fileName) => {
              if (fileName === "test.ts") {
                return sourceFile;
              }
              return undefined;
            },
            getDefaultLibFileName: () => "lib.d.ts",
            writeFile: () => {},
            getCurrentDirectory: () => "",
            getCanonicalFileName: (f) => f,
            useCaseSensitiveFileNames: () => true,
            getNewLine: () => "\n",
            fileExists: (fileName) => fileName === "test.ts",
            readFile: () => "",
            directoryExists: () => true,
            getDirectories: () => [],
          },
        });

        const result = ts.transform(sourceFile, [transformer(program)]);
        return ts.createPrinter().printFile(result.transformed[0]);
      };
      const code = `
      class Tools {
        @fn
        static example(abc: number[]): string {
          return "";
        }
      }
      `;

      expect(transform(code)).toMatchInlineSnapshot(`
        "const __example__json__schema = {
            type: "function",
            function: { name: "example", description: "", strict: true, parameters: { name: "abc", type: "array", description: "", items: { type: "number" } } }
        };
        function __decorate__example__json__schema(target, context) {
            function method(...args) { return target.call(this, ...args); }
            method.toJSONSchema = () => __example__json__schema;
            return method;
        }
        class Tools {
            @__decorate__example__json__schema
            static example(abc: number[]): string {
                return "";
            }
        }
        "
      `);
    });

    test("when parameter is an array with union Array<T | K>", async () => {
      // Transformer setup (for testing)
      const transform = (code: string) => {
        const sourceFile = ts.createSourceFile(
          "",
          code,
          ts.ScriptTarget.Latest,
          true
        );

        const program = ts.createProgram({
          rootNames: ["test.ts"],
          options: {
            target: ts.ScriptTarget.ESNext,
            module: ts.ModuleKind.CommonJS,
            strict: true, // Add this
            strictNullChecks: true, // Add this - important for null unions
          },
          host: {
            getSourceFile: (fileName) => {
              if (fileName === "test.ts") {
                return sourceFile;
              }
              return undefined;
            },
            getDefaultLibFileName: () => "lib.d.ts",
            writeFile: () => {},
            getCurrentDirectory: () => "",
            getCanonicalFileName: (f) => f,
            useCaseSensitiveFileNames: () => true,
            getNewLine: () => "\n",
            fileExists: (fileName) => fileName === "test.ts",
            readFile: () => "",
            directoryExists: () => true,
            getDirectories: () => [],
          },
        });

        const result = ts.transform(sourceFile, [transformer(program)]);
        return ts.createPrinter().printFile(result.transformed[0]);
      };
      const code = `
      class Tools {
        @fn
        static example(abc: Array<string | number>): string {
          return "";
        }
      }
      `;

      expect(transform(code)).toMatchInlineSnapshot(`
        "const __example__json__schema = {
            type: "function",
            function: { name: "example", description: "", strict: true, parameters: { name: "abc", type: "array", description: "", items: { oneOf: [{ type: "string" }, { type: "number" }] } } }
        };
        function __decorate__example__json__schema(target, context) {
            function method(...args) { return target.call(this, ...args); }
            method.toJSONSchema = () => __example__json__schema;
            return method;
        }
        class Tools {
            @__decorate__example__json__schema
            static example(abc: Array<string | number>): string {
                return "";
            }
        }
        "
      `);
    });

    test("when parameter is an array with a map Array<{ id: number, item: string }>", async () => {
      // Transformer setup (for testing)
      const transform = (code: string) => {
        const sourceFile = ts.createSourceFile(
          "",
          code,
          ts.ScriptTarget.Latest,
          true
        );

        const program = ts.createProgram({
          rootNames: ["test.ts"],
          options: {
            target: ts.ScriptTarget.ESNext,
            module: ts.ModuleKind.CommonJS,
            strict: true, // Add this
            strictNullChecks: true, // Add this - important for null unions
          },
          host: {
            getSourceFile: (fileName) => {
              if (fileName === "test.ts") {
                return sourceFile;
              }
              return undefined;
            },
            getDefaultLibFileName: () => "lib.d.ts",
            writeFile: () => {},
            getCurrentDirectory: () => "",
            getCanonicalFileName: (f) => f,
            useCaseSensitiveFileNames: () => true,
            getNewLine: () => "\n",
            fileExists: (fileName) => fileName === "test.ts",
            readFile: () => "",
            directoryExists: () => true,
            getDirectories: () => [],
          },
        });

        const result = ts.transform(sourceFile, [transformer(program)]);
        return ts.createPrinter().printFile(result.transformed[0]);
      };
      const code = `
      class Tools {
        @fn
        static example(abc: Array<{ id: number, item: string }>): string {
          return "";
        }
      }
      `;

      expect(transform(code)).toMatchInlineSnapshot(`
        "const __example__json__schema = {
            type: "function",
            function: { name: "example", description: "", strict: true, parameters: { name: "abc", type: "array", description: "", items: { type: "{ id: number; item: string; }" } } }
        };
        function __decorate__example__json__schema(target, context) {
            function method(...args) { return target.call(this, ...args); }
            method.toJSONSchema = () => __example__json__schema;
            return method;
        }
        class Tools {
            @__decorate__example__json__schema
            static example(abc: Array<{
                id: number;
                item: string;
            }>): string {
                return "";
            }
        }
        "
      `);
    });

    describe("decorator supports parameters", async () => {
      test("when there is a description", async () => {
        // Transformer setup (for testing)
        const transform = (code: string) => {
          const sourceFile = ts.createSourceFile(
            "",
            code,
            ts.ScriptTarget.Latest,
            true
          );

          const program = ts.createProgram({
            rootNames: ["test.ts"],
            options: {
              target: ts.ScriptTarget.ESNext,
              module: ts.ModuleKind.CommonJS,
            },
            host: {
              getSourceFile: () => sourceFile,
              getDefaultLibFileName: () => "lib.d.ts",
              writeFile: () => {},
              getCurrentDirectory: () => "",
              getCanonicalFileName: (f) => f,
              useCaseSensitiveFileNames: () => true,
              getNewLine: () => "\n",
              fileExists: () => true,
              readFile: () => "",
              directoryExists: () => true,
              getDirectories: () => [],
            },
          });

          const result = ts.transform(sourceFile, [transformer(program)]);
          return ts.createPrinter().printFile(result.transformed[0]);
        };
        const code = `
        class Tools {
          @fn({ description: "This is a function for test" })
          static example(abc: string): string {
            return "";
          }
        }
        `;

        expect(transform(code)).toMatchInlineSnapshot(`
          "const __example__json__schema = {
              type: "function",
              function: { name: "example", description: "This is a function for test", strict: true, parameters: {
                      type: "object",
                      properties: {
                          "abc": { type: "string", description: "" }
                      },
                      required: ["abc"]
                  } }
          };
          function __decorate__example__json__schema(target, context) {
              function method(...args) { return target.call(this, ...args); }
              method.toJSONSchema = () => __example__json__schema;
              return method;
          }
          class Tools {
              @__decorate__example__json__schema
              static example(abc: string): string {
                  return "";
              }
          }
          "
        `);
      });

      test("when there is strict=false", async () => {
        // Transformer setup (for testing)
        const transform = (code: string) => {
          const sourceFile = ts.createSourceFile(
            "",
            code,
            ts.ScriptTarget.Latest,
            true
          );

          const program = ts.createProgram({
            rootNames: ["test.ts"],
            options: {
              target: ts.ScriptTarget.ESNext,
              module: ts.ModuleKind.CommonJS,
            },
            host: {
              getSourceFile: () => sourceFile,
              getDefaultLibFileName: () => "lib.d.ts",
              writeFile: () => {},
              getCurrentDirectory: () => "",
              getCanonicalFileName: (f) => f,
              useCaseSensitiveFileNames: () => true,
              getNewLine: () => "\n",
              fileExists: () => true,
              readFile: () => "",
              directoryExists: () => true,
              getDirectories: () => [],
            },
          });

          const result = ts.transform(sourceFile, [transformer(program)]);
          return ts.createPrinter().printFile(result.transformed[0]);
        };
        const code = `
        class Tools {
          @fn({ strict: false })
          static example(abc: string): string {
            return "";
          }
        }
        `;

        expect(transform(code)).toMatchInlineSnapshot(`
          "const __example__json__schema = {
              type: "function",
              function: { name: "example", description: "", strict: false, parameters: {
                      type: "object",
                      properties: {
                          "abc": { type: "string", description: "" }
                      },
                      required: ["abc"]
                  } }
          };
          function __decorate__example__json__schema(target, context) {
              function method(...args) { return target.call(this, ...args); }
              method.toJSONSchema = () => __example__json__schema;
              return method;
          }
          class Tools {
              @__decorate__example__json__schema
              static example(abc: string): string {
                  return "";
              }
          }
          "
        `);
      });

      test("when there is parameter description", async () => {
        // Transformer setup (for testing)
        const transform = (code: string) => {
          const sourceFile = ts.createSourceFile(
            "",
            code,
            ts.ScriptTarget.Latest,
            true
          );

          const program = ts.createProgram({
            rootNames: ["test.ts"],
            options: {
              target: ts.ScriptTarget.ESNext,
              module: ts.ModuleKind.CommonJS,
            },
            host: {
              getSourceFile: () => sourceFile,
              getDefaultLibFileName: () => "lib.d.ts",
              writeFile: () => {},
              getCurrentDirectory: () => "",
              getCanonicalFileName: (f) => f,
              useCaseSensitiveFileNames: () => true,
              getNewLine: () => "\n",
              fileExists: () => true,
              readFile: () => "",
              directoryExists: () => true,
              getDirectories: () => [],
            },
          });

          const result = ts.transform(sourceFile, [transformer(program)]);
          return ts.createPrinter().printFile(result.transformed[0]);
        };
        const code = `
        class Tools {
          @fn({ strict: false, parameters: { abc: { description: "This is a parameter for test" } } })
          static example(abc: string): string {
            return "";
          }
        }
        `;

        expect(transform(code)).toMatchInlineSnapshot(`
          "const __example__json__schema = {
              type: "function",
              function: { name: "example", description: "", strict: false, parameters: {
                      type: "object",
                      properties: {
                          "abc": { type: "string", description: "This is a parameter for test" }
                      },
                      required: ["abc"]
                  } }
          };
          function __decorate__example__json__schema(target, context) {
              function method(...args) { return target.call(this, ...args); }
              method.toJSONSchema = () => __example__json__schema;
              return method;
          }
          class Tools {
              @__decorate__example__json__schema
              static example(abc: string): string {
                  return "";
              }
          }
          "
        `);
      });
    });
  });

  describe("can parse function with an object parameter", async () => {
    test("with one layer depth, simple properities (string, number, boolean)", async () => {
      // Transformer setup (for testing)
      const transform = (code: string) => {
        const sourceFile = ts.createSourceFile(
          "",
          code,
          ts.ScriptTarget.Latest,
          true
        );

        const program = ts.createProgram({
          rootNames: ["test.ts"],
          options: {
            target: ts.ScriptTarget.ESNext,
            module: ts.ModuleKind.CommonJS,
          },
          host: {
            getSourceFile: () => sourceFile,
            getDefaultLibFileName: () => "lib.d.ts",
            writeFile: () => {},
            getCurrentDirectory: () => "",
            getCanonicalFileName: (f) => f,
            useCaseSensitiveFileNames: () => true,
            getNewLine: () => "\n",
            fileExists: () => true,
            readFile: () => "",
            directoryExists: () => true,
            getDirectories: () => [],
          },
        });

        const result = ts.transform(sourceFile, [transformer(program)]);
        return ts.createPrinter().printFile(result.transformed[0]);
      };
      const code = `
      class Tools {
        @fn
        static example(abc: { foo: string, bar: number, bool: boolean }): string {
            return "";
        }
    }
      `;

      expect(transform(code)).toMatchInlineSnapshot(`
        "const __example__json__schema = {
            type: "function",
            function: { name: "example", description: "", strict: true, parameters: { type: "object", properties: {
                        "foo": "string",
                        "bar": "number",
                        "bool": "boolean"
                    }, required: ["foo", "bar", "bool"], additionalProperties: false } }
        };
        function __decorate__example__json__schema(target, context) {
            function method(...args) { return target.call(this, ...args); }
            method.toJSONSchema = () => __example__json__schema;
            return method;
        }
        class Tools {
            @__decorate__example__json__schema
            static example(abc: {
                foo: string;
                bar: number;
                bool: boolean;
            }): string {
                return "";
            }
        }
        "
      `);
    });

    test("with (depth=2) nested object type, simple properities (string, number, boolean)", async () => {
      // Transformer setup (for testing)
      const transform = (code: string) => {
        const sourceFile = ts.createSourceFile(
          "",
          code,
          ts.ScriptTarget.Latest,
          true
        );

        const program = ts.createProgram({
          rootNames: ["test.ts"],
          options: {
            target: ts.ScriptTarget.ESNext,
            module: ts.ModuleKind.CommonJS,
          },
          host: {
            getSourceFile: () => sourceFile,
            getDefaultLibFileName: () => "lib.d.ts",
            writeFile: () => {},
            getCurrentDirectory: () => "",
            getCanonicalFileName: (f) => f,
            useCaseSensitiveFileNames: () => true,
            getNewLine: () => "\n",
            fileExists: () => true,
            readFile: () => "",
            directoryExists: () => true,
            getDirectories: () => [],
          },
        });

        const result = ts.transform(sourceFile, [transformer(program)]);
        return ts.createPrinter().printFile(result.transformed[0]);
      };
      const code = `
      class Tools {
        @fn
        static example(abc: { foo: string, bar: { a: string, b: number, c: { d: string }}, bool: boolean }): string {
            return "";
        }
    }
      `;

      expect(transform(code)).toMatchInlineSnapshot(`
        "const __example__json__schema = {
            type: "function",
            function: { name: "example", description: "", strict: true, parameters: { type: "object", properties: {
                        "foo": "string",
                        "bar": {
                            "type": "object",
                            "properties": {
                                "a": "string",
                                "b": "number",
                                "c": {
                                    "type": "object",
                                    "properties": {
                                        "d": "string"
                                    },
                                    "required": ["d"]
                                }
                            },
                            "required": ["a", "b", "c"]
                        },
                        "bool": "boolean"
                    }, required: ["foo", "bar", "bool"], additionalProperties: false } }
        };
        function __decorate__example__json__schema(target, context) {
            function method(...args) { return target.call(this, ...args); }
            method.toJSONSchema = () => __example__json__schema;
            return method;
        }
        class Tools {
            @__decorate__example__json__schema
            static example(abc: {
                foo: string;
                bar: {
                    a: string;
                    b: number;
                    c: {
                        d: string;
                    };
                };
                bool: boolean;
            }): string {
                return "";
            }
        }
        "
      `);
    });

    test("with one layer depth, properities with union", async () => {
      // Transformer setup (for testing)
      const transform = (code: string) => {
        const sourceFile = ts.createSourceFile(
          "",
          code,
          ts.ScriptTarget.Latest,
          true
        );

        const program = ts.createProgram({
          rootNames: ["test.ts"],
          options: {
            target: ts.ScriptTarget.ESNext,
            module: ts.ModuleKind.CommonJS,
            strict: true, // Add this
            strictNullChecks: true, // Add this - important for null unions
          },
          host: {
            getSourceFile: (fileName) => {
              if (fileName === "test.ts") {
                return sourceFile;
              }
              return undefined;
            },
            getDefaultLibFileName: () => "lib.d.ts",
            writeFile: () => {},
            getCurrentDirectory: () => "",
            getCanonicalFileName: (f) => f,
            useCaseSensitiveFileNames: () => true,
            getNewLine: () => "\n",
            fileExists: (fileName) => fileName === "test.ts",
            readFile: () => "",
            directoryExists: () => true,
            getDirectories: () => [],
          },
        });

        const result = ts.transform(sourceFile, [transformer(program)]);
        return ts.createPrinter().printFile(result.transformed[0]);
      };
      const code = `
      class Tools {
        @fn
        static example(abc: { foo: string | null, bar: number | string | null, bool: boolean }): string {
            return "";
        }
    }
      `;

      expect(transform(code)).toMatchInlineSnapshot(`
        "const __example__json__schema = {
            type: "function",
            function: { name: "example", description: "", strict: true, parameters: { type: "object", properties: {
                        "foo": "string | null",
                        "bar": "string | number | null",
                        "bool": "boolean"
                    }, required: ["foo", "bar", "bool"], additionalProperties: false } }
        };
        function __decorate__example__json__schema(target, context) {
            function method(...args) { return target.call(this, ...args); }
            method.toJSONSchema = () => __example__json__schema;
            return method;
        }
        class Tools {
            @__decorate__example__json__schema
            static example(abc: {
                foo: string | null;
                bar: number | string | null;
                bool: boolean;
            }): string {
                return "";
            }
        }
        "
      `);
    });

    test("with one layer depth, properities with array Array<T>", async () => {
      // Transformer setup (for testing)
      const transform = (code: string) => {
        const sourceFile = ts.createSourceFile(
          "",
          code,
          ts.ScriptTarget.Latest,
          true
        );

        const program = ts.createProgram({
          rootNames: ["test.ts"],
          options: {
            target: ts.ScriptTarget.ESNext,
            module: ts.ModuleKind.CommonJS,
            strict: true, // Add this
            strictNullChecks: true, // Add this - important for null unions
          },
          host: {
            getSourceFile: (fileName) => {
              if (fileName === "test.ts") {
                return sourceFile;
              }
              return undefined;
            },
            getDefaultLibFileName: () => "lib.d.ts",
            writeFile: () => {},
            getCurrentDirectory: () => "",
            getCanonicalFileName: (f) => f,
            useCaseSensitiveFileNames: () => true,
            getNewLine: () => "\n",
            fileExists: (fileName) => fileName === "test.ts",
            readFile: () => "",
            directoryExists: () => true,
            getDirectories: () => [],
          },
        });

        const result = ts.transform(sourceFile, [transformer(program)]);
        return ts.createPrinter().printFile(result.transformed[0]);
      };
      const code = `
      class Tools {
        @fn
        static example(abc: { foo: Array<string>, bar: number | string | null, bool: boolean }): string {
            return "";
        }
    }
      `;

      expect(transform(code)).toMatchInlineSnapshot(`
        "const __example__json__schema = {
            type: "function",
            function: { name: "example", description: "", strict: true, parameters: { type: "object", properties: {
                        "foo": "Array<string>",
                        "bar": "string | number | null",
                        "bool": "boolean"
                    }, required: ["foo", "bar", "bool"], additionalProperties: false } }
        };
        function __decorate__example__json__schema(target, context) {
            function method(...args) { return target.call(this, ...args); }
            method.toJSONSchema = () => __example__json__schema;
            return method;
        }
        class Tools {
            @__decorate__example__json__schema
            static example(abc: {
                foo: Array<string>;
                bar: number | string | null;
                bool: boolean;
            }): string {
                return "";
            }
        }
        "
      `);
    });

    test("with one layer depth, properities with map in array Array<{ a: string, b: number }>", async () => {
      // Transformer setup (for testing)
      const transform = (code: string) => {
        const sourceFile = ts.createSourceFile(
          "",
          code,
          ts.ScriptTarget.Latest,
          true
        );

        const program = ts.createProgram({
          rootNames: ["test.ts"],
          options: {
            target: ts.ScriptTarget.ESNext,
            module: ts.ModuleKind.CommonJS,
            strict: true, // Add this
            strictNullChecks: true, // Add this - important for null unions
          },
          host: {
            getSourceFile: (fileName) => {
              if (fileName === "test.ts") {
                return sourceFile;
              }
              return undefined;
            },
            getDefaultLibFileName: () => "lib.d.ts",
            writeFile: () => {},
            getCurrentDirectory: () => "",
            getCanonicalFileName: (f) => f,
            useCaseSensitiveFileNames: () => true,
            getNewLine: () => "\n",
            fileExists: (fileName) => fileName === "test.ts",
            readFile: () => "",
            directoryExists: () => true,
            getDirectories: () => [],
          },
        });

        const result = ts.transform(sourceFile, [transformer(program)]);
        return ts.createPrinter().printFile(result.transformed[0]);
      };
      const code = `
      class Tools {
        @fn
        static example(abc: { foo: Array<{ a: string, b: number }>, bar: number | string | null, bool: boolean }): string {
            return "";
        }
    }
      `;

      expect(transform(code)).toMatchInlineSnapshot(`
        "const __example__json__schema = {
            type: "function",
            function: { name: "example", description: "", strict: true, parameters: { type: "object", properties: {
                        "foo": "Array<{ a: string; b: number; }>",
                        "bar": "string | number | null",
                        "bool": "boolean"
                    }, required: ["foo", "bar", "bool"], additionalProperties: false } }
        };
        function __decorate__example__json__schema(target, context) {
            function method(...args) { return target.call(this, ...args); }
            method.toJSONSchema = () => __example__json__schema;
            return method;
        }
        class Tools {
            @__decorate__example__json__schema
            static example(abc: {
                foo: Array<{
                    a: string;
                    b: number;
                }>;
                bar: number | string | null;
                bool: boolean;
            }): string {
                return "";
            }
        }
        "
      `);
    });

    // nested array in object props not working
    test("with one layer depth, properities with nested array Array<Array<T>>", async () => {
      // Transformer setup (for testing)
      const transform = (code: string) => {
        const sourceFile = ts.createSourceFile(
          "",
          code,
          ts.ScriptTarget.Latest,
          true
        );

        const program = ts.createProgram({
          rootNames: ["test.ts"],
          options: {
            target: ts.ScriptTarget.ESNext,
            module: ts.ModuleKind.CommonJS,
            strict: true, // Add this
            strictNullChecks: true, // Add this - important for null unions
          },
          host: {
            getSourceFile: (fileName) => {
              if (fileName === "test.ts") {
                return sourceFile;
              }
              return undefined;
            },
            getDefaultLibFileName: () => "lib.d.ts",
            writeFile: () => {},
            getCurrentDirectory: () => "",
            getCanonicalFileName: (f) => f,
            useCaseSensitiveFileNames: () => true,
            getNewLine: () => "\n",
            fileExists: (fileName) => fileName === "test.ts",
            readFile: () => "",
            directoryExists: () => true,
            getDirectories: () => [],
          },
        });

        const result = ts.transform(sourceFile, [transformer(program)]);
        return ts.createPrinter().printFile(result.transformed[0]);
      };
      const code = `
      class Tools {
        @fn
        static example(abc: { foo: Array<Array<string>>, bar: number | string | null, bool: boolean }): string {
            return "";
        }
    }
      `;

      expect(transform(code)).toMatchInlineSnapshot(`
        "const __example__json__schema = {
            type: "function",
            function: { name: "example", description: "", strict: true, parameters: { type: "object", properties: {
                        "foo": "Array<Array<string>>",
                        "bar": "string | number | null",
                        "bool": "boolean"
                    }, required: ["foo", "bar", "bool"], additionalProperties: false } }
        };
        function __decorate__example__json__schema(target, context) {
            function method(...args) { return target.call(this, ...args); }
            method.toJSONSchema = () => __example__json__schema;
            return method;
        }
        class Tools {
            @__decorate__example__json__schema
            static example(abc: {
                foo: Array<Array<string>>;
                bar: number | string | null;
                bool: boolean;
            }): string {
                return "";
            }
        }
        "
      `);
    });

    test("with one layer depth, properities with array T[]", async () => {
      // Transformer setup (for testing)
      const transform = (code: string) => {
        const sourceFile = ts.createSourceFile(
          "",
          code,
          ts.ScriptTarget.Latest,
          true
        );

        const program = ts.createProgram({
          rootNames: ["test.ts"],
          options: {
            target: ts.ScriptTarget.ESNext,
            module: ts.ModuleKind.CommonJS,
            strict: true, // Add this
            strictNullChecks: true, // Add this - important for null unions
          },
          host: {
            getSourceFile: (fileName) => {
              if (fileName === "test.ts") {
                return sourceFile;
              }
              return undefined;
            },
            getDefaultLibFileName: () => "lib.d.ts",
            writeFile: () => {},
            getCurrentDirectory: () => "",
            getCanonicalFileName: (f) => f,
            useCaseSensitiveFileNames: () => true,
            getNewLine: () => "\n",
            fileExists: (fileName) => fileName === "test.ts",
            readFile: () => "",
            directoryExists: () => true,
            getDirectories: () => [],
          },
        });

        const result = ts.transform(sourceFile, [transformer(program)]);
        return ts.createPrinter().printFile(result.transformed[0]);
      };
      const code = `
      class Tools {
        @fn
        static example(abc: { foo: number[], bar: number | string | null, bool: boolean }): string {
            return "";
        }
    }
      `;

      expect(transform(code)).toMatchInlineSnapshot(`
        "const __example__json__schema = {
            type: "function",
            function: { name: "example", description: "", strict: true, parameters: { type: "object", properties: {
                        "foo": {
                            "type": "object",
                            "properties": {},
                            "required": []
                        },
                        "bar": "string | number | null",
                        "bool": "boolean"
                    }, required: ["foo", "bar", "bool"], additionalProperties: false } }
        };
        function __decorate__example__json__schema(target, context) {
            function method(...args) { return target.call(this, ...args); }
            method.toJSONSchema = () => __example__json__schema;
            return method;
        }
        class Tools {
            @__decorate__example__json__schema
            static example(abc: {
                foo: number[];
                bar: number | string | null;
                bool: boolean;
            }): string {
                return "";
            }
        }
        "
      `);
    });

    test("with additionalProperties=true", async () => {
      // Transformer setup (for testing)
      const transform = (code: string) => {
        const sourceFile = ts.createSourceFile(
          "",
          code,
          ts.ScriptTarget.Latest,
          true
        );

        const program = ts.createProgram({
          rootNames: ["test.ts"],
          options: {
            target: ts.ScriptTarget.ESNext,
            module: ts.ModuleKind.CommonJS,
          },
          host: {
            getSourceFile: () => sourceFile,
            getDefaultLibFileName: () => "lib.d.ts",
            writeFile: () => {},
            getCurrentDirectory: () => "",
            getCanonicalFileName: (f) => f,
            useCaseSensitiveFileNames: () => true,
            getNewLine: () => "\n",
            fileExists: () => true,
            readFile: () => "",
            directoryExists: () => true,
            getDirectories: () => [],
          },
        });

        const result = ts.transform(sourceFile, [transformer(program)]);
        return ts.createPrinter().printFile(result.transformed[0]);
      };
      const code = `
      class Tools {
        @fn({ additionalProperties: true })
        static example(abc: { foo: string, bar: number, bool: boolean }): string {
            return "";
        }
    }
      `;

      expect(transform(code)).toMatchInlineSnapshot(`
        "const __example__json__schema = {
            type: "function",
            function: { name: "example", description: "", strict: true, parameters: { type: "object", properties: {
                        "foo": "string",
                        "bar": "number",
                        "bool": "boolean"
                    }, required: ["foo", "bar", "bool"], additionalProperties: true } }
        };
        function __decorate__example__json__schema(target, context) {
            function method(...args) { return target.call(this, ...args); }
            method.toJSONSchema = () => __example__json__schema;
            return method;
        }
        class Tools {
            @__decorate__example__json__schema
            static example(abc: {
                foo: string;
                bar: number;
                bool: boolean;
            }): string {
                return "";
            }
        }
        "
      `);
    });

    // unfortunately, ts doesn't support decorator on function parameters
    test("with parameter descriptions", async () => {
      // Transformer setup (for testing)
      const transform = (code: string) => {
        const sourceFile = ts.createSourceFile(
          "",
          code,
          ts.ScriptTarget.Latest,
          true
        );

        const program = ts.createProgram({
          rootNames: ["test.ts"],
          options: {
            target: ts.ScriptTarget.ESNext,
            module: ts.ModuleKind.CommonJS,
          },
          host: {
            getSourceFile: () => sourceFile,
            getDefaultLibFileName: () => "lib.d.ts",
            writeFile: () => {},
            getCurrentDirectory: () => "",
            getCanonicalFileName: (f) => f,
            useCaseSensitiveFileNames: () => true,
            getNewLine: () => "\n",
            fileExists: () => true,
            readFile: () => "",
            directoryExists: () => true,
            getDirectories: () => [],
          },
        });

        const result = ts.transform(sourceFile, [transformer(program)]);
        return ts.createPrinter().printFile(result.transformed[0]);
      };
      const code = `
      class Tools {
        @fn({ parameters: { foo: { description: "This is bar" }, bar: { description: "This is bar" } }})
        static example(abc: { foo: string, bar: number, bool: boolean }): string {
            return "";
        }
    }
      `;

      expect(transform(code)).toMatchInlineSnapshot(`
        "const __example__json__schema = {
            type: "function",
            function: { name: "example", description: "", strict: true, parameters: { type: "object", properties: {
                        "foo": {
                            "type": "string",
                            "description": "This is bar"
                        },
                        "bar": {
                            "type": "number",
                            "description": "This is bar"
                        },
                        "bool": "boolean"
                    }, required: ["foo", "bar", "bool"], additionalProperties: false } }
        };
        function __decorate__example__json__schema(target, context) {
            function method(...args) { return target.call(this, ...args); }
            method.toJSONSchema = () => __example__json__schema;
            return method;
        }
        class Tools {
            @__decorate__example__json__schema
            static example(abc: {
                foo: string;
                bar: number;
                bool: boolean;
            }): string {
                return "";
            }
        }
        "
      `);
    });
  });

  test("handles 2+ decorators", async () => {
    // Transformer setup (for testing)
    const transform = (code: string) => {
      const sourceFile = ts.createSourceFile(
        "",
        code,
        ts.ScriptTarget.Latest,
        true
      );

      const program = ts.createProgram({
        rootNames: ["test.ts"], // CHANGED
        options: {
          target: ts.ScriptTarget.ESNext,
          module: ts.ModuleKind.CommonJS,
        },
        host: {
          getSourceFile: (fileName) => {
            if (fileName === "test.ts") {
              return sourceFile;
            }
            return undefined; 
          },
          getDefaultLibFileName: () => "lib.d.ts",
          writeFile: () => {},
          getCurrentDirectory: () => "",
          getCanonicalFileName: (f) => f,
          useCaseSensitiveFileNames: () => true,
          getNewLine: () => "\n",
          fileExists: (fileName) => fileName === "test.ts" || fileName === "lib.d.ts",
          readFile: (fileName) => fileName === "test.ts" ? code : "",
          directoryExists: () => true,
          getDirectories: () => [],
        },
      });

      const result = ts.transform(sourceFile, [transformer(program)]);
      const transformedSourceFile = result.transformed[0];
      const printer = ts.createPrinter();
      const transformedJsString = printer.printFile(transformedSourceFile);
      
      // Transpile the transformed TypeScript string to JavaScript
      const jsOutput = ts.transpileModule(transformedJsString, {
        compilerOptions: {
          module: ts.ModuleKind.CommonJS,
          target: ts.ScriptTarget.ES2020, // Changed target
          experimentalDecorators: true,    // Added
          // emitDecoratorMetadata: true, // Usually not needed unless your decorator uses metadata
        }
      });
      return jsOutput.outputText;
    };
    const code = `
      class Tools {
        @fn
        static one(): string {
          return "";
        }

        @fn
        static two(a: string): string {
          return "";
        }

        @fn
        static three({ b }: { b: number }): string {
          return "";
        }
      }
      `;

    expect(transform(code)).toMatchInlineSnapshot(`
      "const __one__json__schema = {
          type: "function",
          function: { name: "one", description: "", strict: true, parameters: { type: "object", properties: {}, required: [], additionalProperties: false } }
      };
      const __two__json__schema = {
          type: "function",
          function: { name: "two", description: "", strict: true, parameters: {
                  type: "object",
                  properties: {
                      "a": { type: "string", description: "" }
                  },
                  required: ["a"]
              } }
      };
      const __three__json__schema = {
          type: "function",
          function: { name: "three", description: "", strict: true, parameters: { type: "object", properties: {
                      "b": "number"
                  }, required: ["b"], additionalProperties: false } }
      };
      function __decorate__one__json__schema(target, context) {
          function method(...args) { return target.call(this, ...args); }
          method.toJSONSchema = () => __one__json__schema;
          return method;
      }
      function __decorate__two__json__schema(target, context) {
          function method(...args) { return target.call(this, ...args); }
          method.toJSONSchema = () => __two__json__schema;
          return method;
      }
      function __decorate__three__json__schema(target, context) {
          function method(...args) { return target.call(this, ...args); }
          method.toJSONSchema = () => __three__json__schema;
          return method;
      }
      class Tools {
          @__decorate__one__json__schema
          static one(): string {
              return "";
          }
          @__decorate__two__json__schema
          static two(a: string): string {
              return "";
          }
          @__decorate__three__json__schema
          static three({ b }: {
              b: number;
          }): string {
              return "";
          }
      }
      "
    `);
  });

  test("if the method doesn't have any parameters, just return schema", async () => {
    // Transformer setup (for testing)
    const transform = (code: string) => {
      const sourceFile = ts.createSourceFile(
        "",
        code,
        ts.ScriptTarget.Latest,
        true
      );

      const program = ts.createProgram({
        rootNames: [],
        options: {
          target: ts.ScriptTarget.ESNext,
          module: ts.ModuleKind.CommonJS,
        },
      });

      const result = ts.transform(sourceFile, [transformer(program)]);
      return ts.createPrinter().printFile(result.transformed[0]);
    };
    const code = `
      class Tools {
        @fn
        static example(): string {
          return "";
        }
      }
      `;

    expect(transform(code)).toMatchInlineSnapshot(`
      "const __example__json__schema = {
          type: "function",
          function: { name: "example", description: "", strict: true, parameters: { type: "object", properties: {}, required: [], additionalProperties: false } }
      };
      function __decorate__example__json__schema(target, context) {
          function method(...args) { return target.call(this, ...args); }
          method.toJSONSchema = () => __example__json__schema;
          return method;
      }
      class Tools {
          @__decorate__example__json__schema
          static example(): string {
              return "";
          }
      }
      "
    `);
  });

  test("skips if the method doesn't have the fn decorator", async () => {
    // Transformer setup (for testing)
    const transform = (code: string) => {
      const sourceFile = ts.createSourceFile(
        "",
        code,
        ts.ScriptTarget.Latest,
        true
      );

      const program = ts.createProgram({
        rootNames: [],
        options: {
          target: ts.ScriptTarget.ESNext,
          module: ts.ModuleKind.CommonJS,
        },
      });

      const result = ts.transform(sourceFile, [transformer(program)]);
      return ts.createPrinter().printFile(result.transformed[0]);
    };
    const code = `
      class Tools {
        static example(): string {
          return "";
        }
      }
      `;

    expect(transform(code)).toMatchInlineSnapshot(`
      "class Tools {
          static example(): string {
              return "";
          }
      }
      "
    `);
  });

  describe("toJSONSchema runtime behavior", () => {
    // Helper function to transform TS code (with custom transformer) and then transpile to JS
    const transformAndTranspile = (tsCode: string) => {
      const sourceFile = ts.createSourceFile(
        "test.ts",
        tsCode,
        ts.ScriptTarget.Latest,
        true
      );

      // Create a program to use the type checker and apply transformers
      const program = ts.createProgram({
        rootNames: ["test.ts"],
        options: {
          target: ts.ScriptTarget.ES2020, // Target for JS output
          module: ts.ModuleKind.CommonJS,
          experimentalDecorators: true,     // Enable decorators
        },
        host: {
          getSourceFile: (fileName) => (fileName === "test.ts" ? sourceFile : undefined),
          getDefaultLibFileName: () => "lib.d.ts",
          writeFile: () => {},
          getCurrentDirectory: () => "",
          getCanonicalFileName: (f) => f,
          useCaseSensitiveFileNames: () => true,
          getNewLine: () => "\n",
          fileExists: (fileName) => fileName === "test.ts" || fileName === "lib.d.ts",
          readFile: (fileName) => (fileName === "test.ts" ? code : ""),
          directoryExists: () => true,
          getDirectories: () => [],
        },
      });

      const result = ts.transform(sourceFile, [transformer(program)]);
      return ts.createPrinter().printFile(result.transformed[0]);
    };

    test("decorated method should have toJSONSchema that returns the correct schema", () => {
      const rawCode = `
// Dummy @fn decorator for the transformer to find and replace.
// Its actual implementation doesn't matter here as it gets replaced.
const fn = (options?: any) => (target: any, context: any) => {};

class TestToolsWithToJSON {
  @fn({ description: "A method for testing toJSONSchema" })
  static testMethodForToJSON(paramStr: string): boolean {
    return paramStr === "hello";
  }
}
`;
      const transformedCode = transformCode(rawCode);

      const context = {
        TestToolsWithToJSONClass: (null as any),
        schemaVariableFromEval: (null as any),
        // The dummy fn needs to be in the context for the initial transformed code to run
        // before our decorator application takes place.
        fn: (options?: any) => (target: any, context: any) => {},
      };
      vm.createContext(context);

      // Augment the transformed code to capture the class and the schema variable
      // The transformer generates __testMethodForToJSON__json__schema
      const augmentedCode = transformedCode +
        `
TestToolsWithToJSONClass = TestToolsWithToJSON;
schemaVariableFromEval = __testMethodForToJSON__json__schema;
`;
      
      const script = new vm.Script(augmentedCode);
      script.runInContext(context);

      // Assertions
      expect(context.TestToolsWithToJSONClass).toBeDefined();
      expect(context.TestToolsWithToJSONClass.testMethodForToJSON).toBeDefined();
      expect(typeof context.TestToolsWithToJSONClass.testMethodForToJSON.toJSONSchema).toBe('function');

      const schemaFromMethod = context.TestToolsWithToJSONClass.testMethodForToJSON.toJSONSchema();
      expect(schemaFromMethod).toBeDefined();
      expect(schemaFromMethod).toEqual(context.schemaVariableFromEval);

      // Sanity check specific parts of the schema
      expect(schemaFromMethod.type).toBe("function");
      expect(schemaFromMethod.function).toBeDefined();
      expect(schemaFromMethod.function.name).toBe("testMethodForToJSON");
      expect(schemaFromMethod.function.description).toBe("A method for testing toJSONSchema");
      expect(schemaFromMethod.function.parameters).toBeDefined();
      expect(schemaFromMethod.function.parameters.type).toBe("object");
      expect(schemaFromMethod.function.parameters.properties.paramStr.type).toBe("string");
      expect(schemaFromMethod.function.parameters.required).toEqual(["paramStr"]);
    });
  });
});
