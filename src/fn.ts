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

export function fn(options?: FnOptions): any {}
