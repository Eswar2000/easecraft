import { ToastStack, type ToastStackItem } from "easecraft";

import {
  createNotificationCenter,
  type NotificationToastAdapterProps,
} from "./notification-center-core.js";

function NotificationToastAdapter(props: NotificationToastAdapterProps) {
  const {
    actionClassName,
    closeClassName,
    contentClassName,
    duration,
    items,
    limit,
    onDismiss,
    onPauseChange,
    toastClassName,
    viewportClassName,
    viewportStyle,
  } = props;
  const optionalProps = {
    ...(actionClassName ? { actionClassName } : {}),
    ...(closeClassName ? { closeClassName } : {}),
    ...(contentClassName ? { contentClassName } : {}),
    ...(duration !== undefined ? { duration } : {}),
    ...(limit !== undefined ? { limit } : {}),
    ...(onPauseChange ? { onPauseChange } : {}),
    ...(toastClassName ? { toastClassName } : {}),
    ...(viewportClassName ? { viewportClassName } : {}),
    ...(viewportStyle ? { viewportStyle } : {}),
  };

  return (
    <ToastStack
      {...optionalProps}
      items={items satisfies readonly ToastStackItem[]}
      onDismiss={onDismiss}
    />
  );
}

export const NotificationCenter = createNotificationCenter(NotificationToastAdapter);

export type {
  NotificationCenterAction,
  NotificationCenterDismissReason,
  NotificationCenterItem,
  NotificationCenterPriority,
  NotificationCenterProps,
} from "./notification-center-core.js";
