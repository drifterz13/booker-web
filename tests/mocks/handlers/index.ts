import { bookHandlers } from "./books";
import { uploadHandlers } from "./uploads";

// Shared successful network behavior. Errors and alternate scenarios belong in tests.
export const handlers = [...bookHandlers, ...uploadHandlers];
