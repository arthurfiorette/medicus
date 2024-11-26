import type { Medicus } from '../../src';

declare global {
  /**
   * Sample of application used in this documentation
   */
  interface YourContext {
    [key: string]: any;
  }

  /**
   * Your medicus own instance
   */
  var medicus: Medicus<YourContext>;
}
