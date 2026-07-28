import {
  useRef,
  useState,
  type ComponentType,
  type CSSProperties,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
  type RefObject,
} from "react";

export interface MobileNavigationItem {
  readonly badge?: ReactNode;
  readonly current?: boolean;
  readonly description?: ReactNode;
  readonly disabled?: boolean;
  readonly href: string;
  readonly icon?: ReactNode;
  readonly id: string;
  readonly label: ReactNode;
  readonly rel?: string;
  readonly target?: string;
}

export interface MobileNavigationSection {
  readonly id: string;
  readonly items: readonly MobileNavigationItem[];
  readonly label?: ReactNode;
}

export interface MobileNavigationDialogAdapterProps {
  readonly children: ReactNode;
  readonly closeClassName?: string;
  readonly closeLabel: string;
  readonly contentClassName?: string;
  readonly contentStyle: CSSProperties;
  readonly description?: ReactNode;
  readonly initialFocusRef: RefObject<HTMLElement | null>;
  readonly onOpenChange: (open: boolean) => void;
  readonly open: boolean;
  readonly overlayClassName?: string;
  readonly overlayStyle?: CSSProperties;
  readonly positionerClassName?: string;
  readonly positionerStyle: CSSProperties;
  readonly title: ReactNode;
  readonly trigger: ReactElement;
}

export interface MobileNavigationPanelProps {
  readonly badgeClassName?: string;
  readonly brand?: ReactNode;
  readonly brandClassName?: string;
  readonly className?: string;
  readonly closeClassName?: string;
  readonly closeLabel?: string;
  readonly closeOnNavigate?: boolean;
  readonly contentClassName?: string;
  readonly defaultOpen?: boolean;
  readonly description?: ReactNode;
  readonly footer?: ReactNode;
  readonly footerClassName?: string;
  readonly itemClassName?: string;
  readonly itemCopyClassName?: string;
  readonly itemDescriptionClassName?: string;
  readonly itemLabelClassName?: string;
  readonly listClassName?: string;
  readonly navLabel?: string;
  readonly onNavigate?: (item: MobileNavigationItem, event: MouseEvent<HTMLAnchorElement>) => void;
  readonly onOpenChange?: (open: boolean) => void;
  readonly open?: boolean | undefined;
  readonly overlayClassName?: string;
  readonly overlayStyle?: CSSProperties;
  readonly panelStyle?: CSSProperties;
  readonly positionerClassName?: string;
  readonly positionerStyle?: CSSProperties;
  readonly sectionClassName?: string;
  readonly sectionLabelClassName?: string;
  readonly sections: readonly MobileNavigationSection[];
  readonly title?: ReactNode;
  readonly trigger: ReactElement;
}

const defaultPanelStyle: CSSProperties = {
  borderRadius: 0,
  height: "100%",
  maxHeight: "100vh",
  maxWidth: "24rem",
  padding: 0,
  width: "min(100vw, 24rem)",
};

const defaultPositionerStyle: CSSProperties = {
  padding: 0,
  placeItems: "stretch end",
};

function validateNavigation(sections: readonly MobileNavigationSection[]): MobileNavigationItem {
  if (sections.length === 0) {
    throw new Error("MobileNavigationPanel requires at least one section.");
  }

  const sectionIds = new Set<string>();
  const itemIds = new Set<string>();
  let currentItemId: string | undefined;
  let firstEnabledItem: MobileNavigationItem | undefined;

  sections.forEach((section) => {
    if (sectionIds.has(section.id)) {
      throw new Error(`MobileNavigationPanel received a duplicate section id: ${section.id}`);
    }

    if (section.items.length === 0) {
      throw new Error(`MobileNavigationPanel section ${section.id} requires at least one item.`);
    }

    sectionIds.add(section.id);
    section.items.forEach((item) => {
      if (itemIds.has(item.id)) {
        throw new Error(`MobileNavigationPanel received a duplicate item id: ${item.id}`);
      }

      if (item.href.trim().length === 0) {
        throw new Error(`MobileNavigationPanel item ${item.id} requires a non-empty href.`);
      }

      if (item.current) {
        if (currentItemId) {
          throw new Error(
            `MobileNavigationPanel received multiple current items: ${currentItemId}, ${item.id}`,
          );
        }

        currentItemId = item.id;
      }

      itemIds.add(item.id);

      if (!item.disabled && !firstEnabledItem) {
        firstEnabledItem = item;
      }
    });
  });

  if (!firstEnabledItem) {
    throw new Error("MobileNavigationPanel requires at least one enabled item.");
  }

  return firstEnabledItem;
}

export function createMobileNavigationPanel(
  NavigationDialog: ComponentType<MobileNavigationDialogAdapterProps>,
) {
  function MobileNavigationPanel(props: MobileNavigationPanelProps) {
    const controlled = Object.hasOwn(props, "open");
    const {
      badgeClassName,
      brand,
      brandClassName,
      className,
      closeClassName,
      closeLabel = "Close navigation",
      closeOnNavigate = true,
      contentClassName,
      defaultOpen = false,
      description = "Browse the primary navigation destinations.",
      footer,
      footerClassName,
      itemClassName,
      itemCopyClassName,
      itemDescriptionClassName,
      itemLabelClassName,
      listClassName,
      navLabel = "Primary navigation",
      onNavigate,
      onOpenChange,
      open,
      overlayClassName,
      overlayStyle,
      panelStyle,
      positionerClassName,
      positionerStyle,
      sectionClassName,
      sectionLabelClassName,
      sections,
      title = "Navigation",
      trigger,
    } = props;
    const firstEnabledItem = validateNavigation(sections);
    const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
    const requestedOpen = controlled ? (open ?? false) : uncontrolledOpen;
    const initialFocusRef = useRef<HTMLAnchorElement>(null);

    function requestOpen(nextOpen: boolean) {
      if (!controlled) {
        setUncontrolledOpen(nextOpen);
      }

      onOpenChange?.(nextOpen);
    }

    return (
      <NavigationDialog
        closeLabel={closeLabel}
        contentStyle={{ ...defaultPanelStyle, ...panelStyle }}
        description={description}
        initialFocusRef={initialFocusRef}
        onOpenChange={requestOpen}
        open={requestedOpen}
        positionerStyle={{ ...defaultPositionerStyle, ...positionerStyle }}
        title={title}
        trigger={trigger}
        {...(closeClassName ? { closeClassName } : {})}
        {...(contentClassName ? { contentClassName } : {})}
        {...(overlayClassName ? { overlayClassName } : {})}
        {...(overlayStyle ? { overlayStyle } : {})}
        {...(positionerClassName ? { positionerClassName } : {})}
      >
        <div className={className} data-easecraft-mobile-navigation="">
          {brand ? (
            <div className={brandClassName} data-easecraft-mobile-navigation-brand="">
              {brand}
            </div>
          ) : null}
          <nav aria-label={navLabel} data-easecraft-mobile-navigation-nav="">
            {sections.map((section) => (
              <div
                className={sectionClassName}
                data-easecraft-mobile-navigation-section=""
                key={section.id}
              >
                {section.label ? (
                  <h3
                    className={sectionLabelClassName}
                    data-easecraft-mobile-navigation-section-label=""
                  >
                    {section.label}
                  </h3>
                ) : null}
                <ul className={listClassName} data-easecraft-mobile-navigation-list="">
                  {section.items.map((item) => {
                    const disabled = item.disabled ?? false;
                    const itemContent = (
                      <>
                        {item.icon ? (
                          <span aria-hidden="true" data-easecraft-mobile-navigation-icon="">
                            {item.icon}
                          </span>
                        ) : null}
                        <span
                          className={itemCopyClassName}
                          data-easecraft-mobile-navigation-item-copy=""
                        >
                          <span
                            className={itemLabelClassName}
                            data-easecraft-mobile-navigation-item-label=""
                          >
                            {item.label}
                          </span>
                          {item.description ? (
                            <span
                              className={itemDescriptionClassName}
                              data-easecraft-mobile-navigation-item-description=""
                            >
                              {item.description}
                            </span>
                          ) : null}
                        </span>
                        {item.badge ? (
                          <span
                            className={badgeClassName}
                            data-easecraft-mobile-navigation-badge=""
                          >
                            {item.badge}
                          </span>
                        ) : null}
                      </>
                    );

                    return (
                      <li key={item.id}>
                        {disabled ? (
                          <span
                            aria-current={item.current ? "page" : undefined}
                            aria-disabled="true"
                            className={itemClassName}
                            data-current={item.current ? true : undefined}
                            data-disabled="true"
                            data-easecraft-mobile-navigation-item=""
                          >
                            {itemContent}
                          </span>
                        ) : (
                          <a
                            aria-current={item.current ? "page" : undefined}
                            className={itemClassName}
                            data-current={item.current ? true : undefined}
                            data-easecraft-mobile-navigation-item=""
                            href={item.href}
                            ref={item.id === firstEnabledItem.id ? initialFocusRef : undefined}
                            rel={item.rel}
                            target={item.target}
                            onClick={(event) => {
                              onNavigate?.(item, event);

                              if (closeOnNavigate) {
                                requestOpen(false);
                              }
                            }}
                          >
                            {itemContent}
                          </a>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
          {footer ? (
            <div className={footerClassName} data-easecraft-mobile-navigation-footer="">
              {footer}
            </div>
          ) : null}
        </div>
      </NavigationDialog>
    );
  }

  MobileNavigationPanel.displayName = "MobileNavigationPanel";
  return MobileNavigationPanel;
}
