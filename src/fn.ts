type FnOptions = { description: string };

export function fn(options?: FnOptions): any;
export function fn(target: any, context: ClassMethodDecoratorContext): any;
export function fn(
  targetOrOptions?: FnOptions,
  context?: ClassMethodDecoratorContext
) {}