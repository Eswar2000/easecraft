import { MotionDialog } from "../motion-dialog.js";

import { createCommandPalette } from "./command-palette-core.js";

export const CommandPalette = createCommandPalette(MotionDialog);

export type { CommandPaletteItem, CommandPaletteProps } from "./command-palette-core.js";
