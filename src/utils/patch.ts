/**
 * Patches an object's property if present
 */
export function patch<T extends Record<never, never>, K extends keyof T>(
  obj: T,
  name: K | (string & {}),
  patch: (original: NonNullable<T[K]>) => T[K]
) {
  if (obj[name as K]) {
    obj[name as K] = patch(obj[name as K]!);
  }
}
