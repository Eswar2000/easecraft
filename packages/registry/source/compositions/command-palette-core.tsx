import {
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentType,
  type KeyboardEvent,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
  type RefObject,
} from "react";

export interface CommandPaletteItem {
  readonly disabled?: boolean;
  readonly id: string;
  readonly keywords?: readonly string[];
  readonly label: string;
  readonly shortcut?: string;
}

export interface CommandPaletteProps {
  readonly className?: string;
  readonly closeClassName?: string;
  readonly contentClassName?: string;
  readonly defaultOpen?: boolean;
  readonly description?: ReactNode;
  readonly emptyClassName?: string;
  readonly emptyMessage?: ReactNode;
  readonly hotkey?: string | null;
  readonly inputClassName?: string;
  readonly items: readonly CommandPaletteItem[];
  readonly listClassName?: string;
  readonly onOpenChange?: (open: boolean) => void;
  readonly onSelect: (item: CommandPaletteItem) => void;
  readonly open?: boolean | undefined;
  readonly optionClassName?: string;
  readonly overlayClassName?: string;
  readonly placeholder?: string;
  readonly resultsLabel?: string;
  readonly title?: ReactNode;
  readonly trigger: ReactElement;
}

export interface CommandPaletteDialogProps {
  readonly children: ReactNode;
  readonly closeClassName?: string;
  readonly contentClassName?: string;
  readonly description?: ReactNode;
  readonly initialFocusRef?: RefObject<HTMLElement | null>;
  readonly onOpenChange?: (open: boolean) => void;
  readonly open?: boolean;
  readonly overlayClassName?: string;
  readonly title: ReactNode;
  readonly trigger: ReactElement;
}

function getOptionId(rootId: string, itemId: string): string {
  return `${rootId}-option-${encodeURIComponent(itemId).replaceAll("%", "-")}`;
}

function filterItems(
  items: readonly CommandPaletteItem[],
  query: string,
): readonly CommandPaletteItem[] {
  const normalizedQuery = query.trim().toLocaleLowerCase();

  if (normalizedQuery.length === 0) {
    return items;
  }

  return items.filter((item) =>
    [item.label, ...(item.keywords ?? [])].join(" ").toLocaleLowerCase().includes(normalizedQuery),
  );
}

function assertUniqueItems(items: readonly CommandPaletteItem[]) {
  const ids = new Set<string>();

  items.forEach((item) => {
    if (ids.has(item.id)) {
      throw new Error(`CommandPalette received a duplicate item id: ${item.id}`);
    }

    ids.add(item.id);
  });
}

export function createCommandPalette(Dialog: ComponentType<CommandPaletteDialogProps>) {
  function CommandPalette(props: CommandPaletteProps) {
    const controlled = Object.hasOwn(props, "open");
    const {
      className,
      closeClassName,
      contentClassName,
      defaultOpen = false,
      description = "Search available commands and choose an action.",
      emptyClassName,
      emptyMessage = "No commands found.",
      hotkey = "k",
      inputClassName,
      items,
      listClassName,
      onOpenChange,
      onSelect,
      open,
      optionClassName,
      overlayClassName,
      placeholder = "Search commands",
      resultsLabel = "Available commands",
      title = "Command palette",
      trigger,
    } = props;
    const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
    const [query, setQuery] = useState("");
    const [activeId, setActiveId] = useState<string>();
    const requestedOpen = controlled ? (open ?? false) : uncontrolledOpen;
    const generatedId = useId();
    const rootId = `easecraft-command-${generatedId}`;
    const listboxId = `${rootId}-listbox`;
    const inputRef = useRef<HTMLInputElement>(null);
    assertUniqueItems(items);

    const visibleItems = filterItems(items, query);
    const enabledItems = visibleItems.filter((item) => !item.disabled);
    const activeItem = enabledItems.find((item) => item.id === activeId) ?? enabledItems[0];
    const activeIndex = activeItem
      ? enabledItems.findIndex((item) => item.id === activeItem.id)
      : -1;

    function requestOpen(nextOpen: boolean) {
      if (!controlled) {
        setUncontrolledOpen(nextOpen);
      }

      if (!nextOpen) {
        setQuery("");
        setActiveId(undefined);
      }

      onOpenChange?.(nextOpen);
    }

    function selectItem(item: CommandPaletteItem) {
      if (item.disabled) {
        return;
      }

      onSelect(item);
      requestOpen(false);
    }

    function moveActive(nextIndex: number) {
      if (enabledItems.length === 0) {
        return;
      }

      const wrappedIndex = (nextIndex + enabledItems.length) % enabledItems.length;
      setActiveId(enabledItems[wrappedIndex]?.id);
    }

    function handleInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        moveActive(activeIndex + 1);
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        moveActive(activeIndex < 0 ? enabledItems.length - 1 : activeIndex - 1);
      } else if (event.key === "Home") {
        event.preventDefault();
        moveActive(0);
      } else if (event.key === "End") {
        event.preventDefault();
        moveActive(enabledItems.length - 1);
      } else if (event.key === "Enter" && activeItem) {
        event.preventDefault();
        selectItem(activeItem);
      }
    }

    function handleOptionKeyDown(event: KeyboardEvent<HTMLLIElement>, item: CommandPaletteItem) {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        selectItem(item);
      }
    }

    function handleOptionMouseDown(event: MouseEvent<HTMLLIElement>, item: CommandPaletteItem) {
      event.preventDefault();
      selectItem(item);
    }

    useEffect(() => {
      if (!hotkey) {
        return undefined;
      }

      function handleGlobalKeyDown(event: globalThis.KeyboardEvent) {
        if (
          (event.metaKey || event.ctrlKey) &&
          !event.altKey &&
          event.key.toLocaleLowerCase() === hotkey?.toLocaleLowerCase()
        ) {
          event.preventDefault();
          const nextOpen = !requestedOpen;

          if (!controlled) {
            setUncontrolledOpen(nextOpen);
          }

          if (!nextOpen) {
            setQuery("");
            setActiveId(undefined);
          }

          onOpenChange?.(nextOpen);
        }
      }

      document.addEventListener("keydown", handleGlobalKeyDown);

      return () => {
        document.removeEventListener("keydown", handleGlobalKeyDown);
      };
    }, [controlled, hotkey, onOpenChange, requestedOpen]);

    const dialogClassProps = {
      ...(closeClassName ? { closeClassName } : {}),
      ...(contentClassName ? { contentClassName } : {}),
      ...(overlayClassName ? { overlayClassName } : {}),
    };

    return (
      <Dialog
        {...dialogClassProps}
        description={description}
        initialFocusRef={inputRef}
        onOpenChange={requestOpen}
        open={requestedOpen}
        title={title}
        trigger={trigger}
      >
        <div className={className} data-easecraft-command-palette="">
          <input
            aria-activedescendant={activeItem ? getOptionId(rootId, activeItem.id) : undefined}
            aria-autocomplete="list"
            aria-controls={listboxId}
            aria-expanded={requestedOpen}
            aria-label={placeholder}
            autoComplete="off"
            className={inputClassName}
            data-easecraft-command-input=""
            placeholder={placeholder}
            ref={inputRef}
            role="combobox"
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.currentTarget.value);
              setActiveId(undefined);
            }}
            onKeyDown={handleInputKeyDown}
          />
          <ul
            aria-label={resultsLabel}
            className={listClassName}
            data-easecraft-command-list=""
            id={listboxId}
            role="listbox"
          >
            {visibleItems.map((item) => {
              const active = item.id === activeItem?.id;

              return (
                <li
                  aria-disabled={item.disabled ? true : undefined}
                  aria-selected={active}
                  className={optionClassName}
                  data-active={active || undefined}
                  data-disabled={item.disabled ? true : undefined}
                  data-easecraft-command-option=""
                  id={getOptionId(rootId, item.id)}
                  key={item.id}
                  role="option"
                  tabIndex={-1}
                  onKeyDown={(event) => {
                    handleOptionKeyDown(event, item);
                  }}
                  onMouseDown={(event) => {
                    handleOptionMouseDown(event, item);
                  }}
                  onMouseMove={() => {
                    if (!item.disabled) {
                      setActiveId(item.id);
                    }
                  }}
                >
                  <span>{item.label}</span>
                  {item.shortcut ? <kbd>{item.shortcut}</kbd> : null}
                </li>
              );
            })}
          </ul>
          {visibleItems.length === 0 ? (
            <p className={emptyClassName} data-easecraft-command-empty="" role="status">
              {emptyMessage}
            </p>
          ) : null}
        </div>
      </Dialog>
    );
  }

  CommandPalette.displayName = "CommandPalette";
  return CommandPalette;
}
