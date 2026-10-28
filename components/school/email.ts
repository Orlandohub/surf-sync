import { regexes } from "zod";

/**
 * The same email rule the server applies (z.string().email() in
 * lib/services/school.ts), so a typo always gets the field's own message
 * instead of the action's generic error.
 */
export const isEmail = (value: string): boolean => regexes.email.test(value);
