import { useId, useState, type ComponentType, type CSSProperties, type ReactNode } from "react";

export type NotificationCenterPriority = "polite" | "assertive";
export type NotificationCenterDismissReason = "action" | "close" | "escape" | "swipe" | "timeout";

export interface NotificationCenterAction {
  readonly altText: string;
  readonly label: ReactNode;
  readonly onClick?: () => void;
}

export interface NotificationCenterItem {
  readonly action?: NotificationCenterAction;
  readonly createdAt?: ReactNode;
  readonly description?: ReactNode;
  readonly duration?: number;
  readonly id: string;
  readonly priority?: NotificationCenterPriority;
  readonly read?: boolean;
  readonly title: ReactNode;
}

export interface NotificationCenterToastItem {
  readonly action?: NotificationCenterAction;
  readonly description?: ReactNode;
  readonly duration?: number;
  readonly id: string;
  readonly priority?: NotificationCenterPriority;
  readonly title: ReactNode;
}

export interface NotificationToastAdapterProps {
  readonly actionClassName?: string;
  readonly closeClassName?: string;
  readonly contentClassName?: string;
  readonly duration?: number;
  readonly items: readonly NotificationCenterToastItem[];
  readonly limit?: number;
  readonly onDismiss: (id: string, reason: NotificationCenterDismissReason) => void;
  readonly onPauseChange?: (id: string, paused: boolean) => void;
  readonly toastClassName?: string;
  readonly viewportClassName?: string;
  readonly viewportStyle?: CSSProperties;
}

export interface NotificationCenterProps {
  readonly actionClassName?: string;
  readonly centerClassName?: string;
  readonly clearLabel?: ReactNode;
  readonly closeClassName?: string;
  readonly contentClassName?: string;
  readonly controlsClassName?: string;
  readonly countClassName?: string;
  readonly defaultItems?: readonly NotificationCenterItem[];
  readonly duration?: number;
  readonly emptyClassName?: string;
  readonly emptyMessage?: ReactNode;
  readonly headerClassName?: string;
  readonly itemClassName?: string;
  readonly items?: readonly NotificationCenterItem[] | undefined;
  readonly limit?: number;
  readonly listClassName?: string;
  readonly markAllReadLabel?: ReactNode;
  readonly markReadLabel?: (item: NotificationCenterItem, read: boolean) => string;
  readonly onClear?: (items: readonly NotificationCenterItem[]) => void;
  readonly onDismiss?: (id: string, reason: NotificationCenterDismissReason) => void;
  readonly onItemsChange?: (items: readonly NotificationCenterItem[]) => void;
  readonly onPauseChange?: (id: string, paused: boolean) => void;
  readonly onReadChange?: (id: string, read: boolean) => void;
  readonly title?: ReactNode;
  readonly toastClassName?: string;
  readonly viewportClassName?: string;
  readonly viewportStyle?: CSSProperties;
}

function validateItems(items: readonly NotificationCenterItem[]) {
  const ids = new Set<string>();

  items.forEach((item) => {
    if (ids.has(item.id)) {
      throw new Error(`NotificationCenter received a duplicate item id: ${item.id}`);
    }

    ids.add(item.id);
  });
}

export function createNotificationCenter(
  ToastAdapter: ComponentType<NotificationToastAdapterProps>,
) {
  function NotificationCenter(props: NotificationCenterProps) {
    const controlled = Object.hasOwn(props, "items");
    const {
      actionClassName,
      centerClassName,
      clearLabel = "Clear all",
      closeClassName,
      contentClassName,
      controlsClassName,
      countClassName,
      defaultItems = [],
      duration,
      emptyClassName,
      emptyMessage = "No notifications yet.",
      headerClassName,
      itemClassName,
      items,
      limit,
      listClassName,
      markAllReadLabel = "Mark all read",
      markReadLabel = (_item, read) => (read ? "Mark as unread" : "Mark as read"),
      onClear,
      onDismiss,
      onItemsChange,
      onPauseChange,
      onReadChange,
      title = "Notification center",
      toastClassName,
      viewportClassName,
      viewportStyle,
    } = props;
    const [uncontrolledItems, setUncontrolledItems] =
      useState<readonly NotificationCenterItem[]>(defaultItems);
    const currentItems = controlled ? (items ?? []) : uncontrolledItems;
    const generatedId = useId();
    const titleId = `easecraft-notification-center-${generatedId}`;
    validateItems(currentItems);
    const unreadItems = currentItems.filter((item) => !item.read);

    function commitItems(nextItems: readonly NotificationCenterItem[]) {
      if (!controlled) {
        setUncontrolledItems(nextItems);
      }

      onItemsChange?.(nextItems);
    }

    function setRead(id: string, read: boolean) {
      const item = currentItems.find((candidate) => candidate.id === id);

      if (!item || (item.read ?? false) === read) {
        return;
      }

      commitItems(
        currentItems.map((candidate) => (candidate.id === id ? { ...candidate, read } : candidate)),
      );
      onReadChange?.(id, read);
    }

    function markAllRead() {
      if (unreadItems.length === 0) {
        return;
      }

      commitItems(currentItems.map((item) => (item.read ? item : { ...item, read: true })));
      unreadItems.forEach((item) => {
        onReadChange?.(item.id, true);
      });
    }

    function clearAll() {
      if (currentItems.length === 0) {
        return;
      }

      commitItems([]);
      onClear?.(currentItems);
    }

    const toastItems = unreadItems.map((item): NotificationCenterToastItem => ({
      id: item.id,
      title: item.title,
      ...(item.description !== undefined ? { description: item.description } : {}),
      ...(item.duration !== undefined ? { duration: item.duration } : {}),
      ...(item.priority !== undefined ? { priority: item.priority } : {}),
      ...(item.action
        ? {
            action: {
              ...item.action,
              onClick: () => {
                item.action?.onClick?.();
              },
            },
          }
        : {}),
    }));
    const toastProps = {
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
      <section
        aria-labelledby={titleId}
        className={centerClassName}
        data-easecraft-notification-center=""
      >
        <header className={headerClassName} data-easecraft-notification-header="">
          <div>
            <h2 id={titleId}>{title}</h2>
            <span
              aria-label={`${unreadItems.length.toString()} unread notifications`}
              className={countClassName}
              data-easecraft-notification-count=""
            >
              {unreadItems.length.toString().padStart(2, "0")} unread
            </span>
          </div>
          <div className={controlsClassName} data-easecraft-notification-controls="">
            <button type="button" disabled={unreadItems.length === 0} onClick={markAllRead}>
              {markAllReadLabel}
            </button>
            <button type="button" disabled={currentItems.length === 0} onClick={clearAll}>
              {clearLabel}
            </button>
          </div>
        </header>

        {currentItems.length > 0 ? (
          <ul aria-label="Notification history" className={listClassName}>
            {currentItems.map((item) => {
              const read = item.read ?? false;

              return (
                <li
                  className={itemClassName}
                  data-easecraft-notification-item=""
                  data-read={read || undefined}
                  key={item.id}
                >
                  <div>
                    <strong>{item.title}</strong>
                    {item.description ? <p>{item.description}</p> : null}
                    {item.createdAt ? <small>{item.createdAt}</small> : null}
                  </div>
                  <button
                    type="button"
                    aria-label={markReadLabel(item, read)}
                    aria-pressed={read}
                    onClick={() => {
                      setRead(item.id, !read);
                    }}
                  >
                    {read ? "Read" : "Unread"}
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className={emptyClassName} data-easecraft-notification-empty="" role="status">
            {emptyMessage}
          </p>
        )}

        <ToastAdapter
          {...toastProps}
          items={toastItems}
          onDismiss={(id, reason) => {
            setRead(id, true);
            onDismiss?.(id, reason);
          }}
        />
      </section>
    );
  }

  NotificationCenter.displayName = "NotificationCenter";
  return NotificationCenter;
}
