import { test, expect, describe } from "vitest";
import * as ts from "typescript";
import transformer from "./transformer";

describe("transformer", async () => {
  describe("can parse function with a simple parameter", async () => {
    test("when parameter is a string", async () => {
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
        static example(abc: string): string {
          return "";
        }
      }
      `;

      expect(transform(code)).toMatchInlineSnapshot(`
        "const __example__json__schema = {
            type: "function",
            function: { name: "example", description: "", strict: true, parameters: [{ name: "abc", type: "string", description: "" }] }
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
            function: { name: "example", description: "", strict: true, parameters: [{ name: "abc", type: "number", description: "" }] }
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
            function: { name: "example", description: "", strict: true, parameters: [{ name: "abc", type: "boolean", description: "" }] }
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
            function: { name: "example", description: "", strict: true, parameters: [{ name: "abc", type: ["string", "null"], description: "" }] }
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
            function: { name: "example", description: "", strict: true, parameters: [{ name: "abc", type: ["string", "number", "null"], description: "" }] }
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
            function: { function: example, parse: JSON.parse, name: "example", description: "", strict: true, parameters: { name: "abc", type: "array", description: "", items: { type: "string" } } }
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
            function: { function: example, parse: JSON.parse, name: "example", description: "", strict: true, parameters: { name: "abc", type: "array", description: "", items: { type: "number" } } }
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
            function: { function: example, parse: JSON.parse, name: "example", description: "", strict: true, parameters: { name: "abc", type: "array", description: "", items: { oneOf: [{ type: "string" }, { type: "number" }] } } }
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
            function: { function: example, parse: JSON.parse, name: "example", description: "", strict: true, parameters: { name: "abc", type: "array", description: "", items: { type: "{ id: number; item: string; }" } } }
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
              function: { name: "example", description: "This is a function for test", strict: true, parameters: [{ name: "abc", type: "string", description: "" }] }
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
              function: { name: "example", description: "", strict: false, parameters: [{ name: "abc", type: "string", description: "" }] }
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
              function: { name: "example", description: "", strict: false, parameters: [{ name: "abc", type: "string", description: "This is a parameter for test" }] }
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
            function: { function: example, parse: JSON.parse, name: "example", description: "", strict: true, parameters: { type: "object", properties: { foo: { type: "string", description: "" }, bar: { type: "number", description: "" }, bool: { type: "boolean", description: "" } }, required: ["foo", "bar", "bool"], additionalProperties: false } }
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

    test.skip("with (depth=2) nested object type, simple properities (string, number, boolean)", async () => {
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
            function: { name: "example", description: "", strict: true, parameters: { type: "object", properties: { foo: { type: "string", description: "" }, bar: { type: { a: "string", b: "number", c: { d: "string" } }, description: "" }, bool: { type: "boolean", description: "" } }, required: ["foo", "bar", "bool"], additionalProperties: false } }
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
            function: { function: example, parse: JSON.parse, name: "example", description: "", strict: true, parameters: { type: "object", properties: { foo: { type: ["string", "null"], description: "" }, bar: { type: ["string", "number", "null"], description: "" }, bool: { type: "boolean", description: "" } }, required: ["foo", "bar", "bool"], additionalProperties: false } }
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
            function: { function: example, parse: JSON.parse, name: "example", description: "", strict: true, parameters: { type: "object", properties: { foo: { type: "array", description: "", items: { type: "string" } }, bar: { type: ["string", "number", "null"], description: "" }, bool: { type: "boolean", description: "" } }, required: ["foo", "bar", "bool"], additionalProperties: false } }
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
            function: { function: example, parse: JSON.parse, name: "example", description: "", strict: true, parameters: { type: "object", properties: { foo: { type: "array", description: "", items: { type: "{ a: string; b: number; }" } }, bar: { type: ["string", "number", "null"], description: "" }, bool: { type: "boolean", description: "" } }, required: ["foo", "bar", "bool"], additionalProperties: false } }
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
    test.skip("with one layer depth, properities with nested array Array<Array<T>>", async () => {
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
            function: { name: "example", description: "", strict: true, parameters: { type: "object", properties: { foo: { type: "array", description: "", items: { type: "{ a: string; b: number; }" } }, bar: { type: ["string", "number", "null"], description: "" }, bool: { type: "boolean", description: "" } }, required: ["foo", "bar", "bool"], additionalProperties: false } }
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
            function: { function: example, parse: JSON.parse, name: "example", description: "", strict: true, parameters: { type: "object", properties: { foo: { type: "array", description: "", items: { type: "number" } }, bar: { type: ["string", "number", "null"], description: "" }, bool: { type: "boolean", description: "" } }, required: ["foo", "bar", "bool"], additionalProperties: false } }
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
            function: { function: example, parse: JSON.parse, name: "example", description: "", strict: true, parameters: { type: "object", properties: { foo: { type: "string", description: "" }, bar: { type: "number", description: "" }, bool: { type: "boolean", description: "" } }, required: ["foo", "bar", "bool"], additionalProperties: true } }
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
            function: { function: example, parse: JSON.parse, name: "example", description: "", strict: true, parameters: { type: "object", properties: { foo: { type: "string", description: "" }, bar: { type: "number", description: "" }, bool: { type: "boolean", description: "" } }, required: ["foo", "bar", "bool"], additionalProperties: false } }
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
          function: { function: one, parse: JSON.parse, name: "one", description: "", strict: true, parameters: { type: "object", properties: {}, required: [], additionalProperties: false } }
      };
      const __two__json__schema = {
          type: "function",
          function: { function: two, parse: JSON.parse, name: "two", description: "", strict: true, parameters: { type: "object", properties: { 0: { type: "a", description: "" }, 1: { type: "n", description: "" }, 2: { type: "y", description: "" } }, required: ["0", "1", "2"], additionalProperties: false } }
      };
      const __three__json__schema = {
          type: "function",
          function: { function: three, parse: JSON.parse, name: "three", description: "", strict: true, parameters: { type: "object", properties: { 0: { type: "a", description: "" }, 1: { type: "n", description: "" }, 2: { type: "y", description: "" } }, required: ["0", "1", "2"], additionalProperties: false } }
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
          function: { function: example, parse: JSON.parse, name: "example", description: "", strict: true, parameters: { type: "object", properties: {}, required: [], additionalProperties: false } }
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
});
