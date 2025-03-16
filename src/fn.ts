type FnOptions = { description: string };

export function fn(
  options?: FnOptions
): (target: any, context: ClassMethodDecoratorContext) => any;
export function fn(target: any, context: ClassMethodDecoratorContext): any;
export function fn(
  targetOrOptions?: any | FnOptions,
  context?: ClassMethodDecoratorContext
) {
  // If called as @fn({ description: '...' })
  if (targetOrOptions && !context) {
    return function (target: any, context: ClassMethodDecoratorContext) {
      // Here you can use targetOrOptions.description
      return target;
    };
  }

  // If called as @fn
  return targetOrOptions;
}
