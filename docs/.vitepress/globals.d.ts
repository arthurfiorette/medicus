import type { Medicus } from '../../src';

// Import Node.js types for Twoslash
/// <reference types="node" />

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

  /**
   * Function that performs a slow check (e.g., database connectivity)
   */
  function performSlowCheck(): Promise<void>;
}
