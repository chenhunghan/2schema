type FnOptions = {
  /**
   * The description of function, what does it do.
   */
  description: string;
  /**
   * The description of parameters of function
   */
  parameters: Record<string, { description: string }>;
  /**
   * output schema with function.strict = true|false, default is true
   */
  strict?: boolean;
  /**
   * output schema with function.additionalProperties = true|false, default is false
   */
  additionalProperties?: boolean;
};

        /**
         * Decorator placeholder for `fn` functionality.
         * The actual schema generation and method modification are handled by a TypeScript transformer.
         * This definition provides type hints for IDEs and allows code to compile before transformation.
         * 
         * @param options - Configuration for the function schema.
         * @returns A MethodDecorator.
         */
        export function fn(options?: FnOptions): MethodDecorator {
          // This is a decorator factory. It returns the actual decorator function.
          return function (
            target: Object, // For static methods, this is the constructor function. For instance methods, it's the prototype.
            propertyKey: string | symbol, // The name of the method.
            descriptor: PropertyDescriptor // The property descriptor for the method.
          ): void {
            // The transformer replaces usages of @fn, so this code block is effectively a no-op
            // if the transformer has run. If the transformer has NOT run, this decorator
            // will be applied but will do nothing to the decorated method.
            // No actual modification to `descriptor` is needed here by the original decorator.
          };
        }
