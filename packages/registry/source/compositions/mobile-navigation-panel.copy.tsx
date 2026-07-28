import { MotionDialog } from "../motion-dialog.js";

import { createMobileNavigationPanel } from "./mobile-navigation-panel-core.js";

export const MobileNavigationPanel = createMobileNavigationPanel(MotionDialog);

export type {
  MobileNavigationItem,
  MobileNavigationPanelProps,
  MobileNavigationSection,
} from "./mobile-navigation-panel-core.js";
