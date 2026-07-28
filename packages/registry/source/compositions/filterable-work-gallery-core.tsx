import { type ComponentType, type ReactNode } from "react";

export type FilterableWorkItemState = "entering" | "present" | "exiting";

export interface FilterableWorkCategory {
  readonly disabled?: boolean;
  readonly label: ReactNode;
  readonly value: string;
}

export interface FilterableWorkItem {
  readonly categories: readonly string[];
  readonly description?: ReactNode;
  readonly href?: string;
  readonly id: string;
  readonly media?: ReactNode;
  readonly meta?: ReactNode;
  readonly title: ReactNode;
  readonly year?: ReactNode;
}

export interface FilterableWorkFilter {
  readonly disabled: boolean;
  readonly label: ReactNode;
  readonly matches: (item: FilterableWorkItem) => boolean;
  readonly value: string;
}

export interface WorkGalleryGridAdapterProps {
  readonly ariaLabel: string;
  readonly children: (item: FilterableWorkItem, state: FilterableWorkItemState) => ReactNode;
  readonly controlClassName?: string;
  readonly controlsClassName?: string;
  readonly defaultValue?: string;
  readonly empty: ReactNode;
  readonly emptyClassName?: string;
  readonly filters: readonly FilterableWorkFilter[];
  readonly galleryClassName?: string;
  readonly gridClassName?: string;
  readonly items: readonly FilterableWorkItem[];
  readonly onValueChange?: (value: string) => void;
  readonly resultClassName?: string;
  readonly value?: string;
}

export interface FilterableWorkGalleryProps {
  readonly allLabel?: ReactNode;
  readonly allValue?: string;
  readonly ariaLabel?: string;
  readonly category?: string;
  readonly categories: readonly FilterableWorkCategory[];
  readonly children?: (item: FilterableWorkItem, state: FilterableWorkItemState) => ReactNode;
  readonly controlClassName?: string;
  readonly controlsClassName?: string;
  readonly defaultCategory?: string;
  readonly emptyClassName?: string;
  readonly emptyMessage?: ReactNode;
  readonly galleryClassName?: string;
  readonly gridClassName?: string;
  readonly itemClassName?: string;
  readonly items: readonly FilterableWorkItem[];
  readonly metaClassName?: string;
  readonly onCategoryChange?: (value: string) => void;
  readonly resultClassName?: string;
  readonly tagsClassName?: string;
}

function validateGallery(
  categories: readonly FilterableWorkCategory[],
  items: readonly FilterableWorkItem[],
  allValue: string,
) {
  const categoryValues = new Set<string>([allValue]);

  categories.forEach((category) => {
    if (categoryValues.has(category.value)) {
      throw new Error(
        `FilterableWorkGallery received a duplicate category value: ${category.value}`,
      );
    }

    categoryValues.add(category.value);
  });

  const itemIds = new Set<string>();
  items.forEach((item) => {
    if (itemIds.has(item.id)) {
      throw new Error(`FilterableWorkGallery received a duplicate item id: ${item.id}`);
    }

    itemIds.add(item.id);
    item.categories.forEach((category) => {
      if (!categoryValues.has(category)) {
        throw new Error(
          `FilterableWorkGallery item ${item.id} references an unknown category: ${category}`,
        );
      }
    });
  });
}

export function createFilterableWorkGallery(
  GalleryGrid: ComponentType<WorkGalleryGridAdapterProps>,
) {
  function FilterableWorkGallery(props: FilterableWorkGalleryProps) {
    const {
      allLabel = "All",
      allValue = "all",
      ariaLabel = "Filter work gallery",
      category,
      categories,
      children,
      controlClassName,
      controlsClassName,
      defaultCategory,
      emptyClassName,
      emptyMessage = "No projects match this category.",
      galleryClassName,
      gridClassName,
      itemClassName,
      items,
      metaClassName,
      onCategoryChange,
      resultClassName,
      tagsClassName,
    } = props;
    validateGallery(categories, items, allValue);
    const categoryByValue = new Map(categories.map((entry) => [entry.value, entry]));
    const filters: readonly FilterableWorkFilter[] = [
      { disabled: false, label: allLabel, matches: () => true, value: allValue },
      ...categories.map((entry) => ({
        disabled: entry.disabled ?? false,
        label: entry.label,
        matches: (item: FilterableWorkItem) => item.categories.includes(entry.value),
        value: entry.value,
      })),
    ];
    const optionalProps = {
      ...(category !== undefined ? { value: category } : {}),
      ...(controlClassName ? { controlClassName } : {}),
      ...(controlsClassName ? { controlsClassName } : {}),
      ...(defaultCategory !== undefined ? { defaultValue: defaultCategory } : {}),
      ...(emptyClassName ? { emptyClassName } : {}),
      ...(galleryClassName ? { galleryClassName } : {}),
      ...(gridClassName ? { gridClassName } : {}),
      ...(onCategoryChange ? { onValueChange: onCategoryChange } : {}),
      ...(resultClassName ? { resultClassName } : {}),
    };

    function renderItem(item: FilterableWorkItem, state: FilterableWorkItemState) {
      if (children) {
        return children(item, state);
      }

      return (
        <article className={itemClassName} data-easecraft-work-card="" data-state={state}>
          {item.media ? <div data-easecraft-work-media="">{item.media}</div> : null}
          <div className={metaClassName} data-easecraft-work-meta="">
            {item.meta ? <span>{item.meta}</span> : null}
            {item.year ? <span>{item.year}</span> : null}
          </div>
          <h3>{item.href ? <a href={item.href}>{item.title}</a> : item.title}</h3>
          {item.description ? <p>{item.description}</p> : null}
          <div className={tagsClassName} data-easecraft-work-tags="">
            {item.categories.map((value) => (
              <span key={value}>{categoryByValue.get(value)?.label ?? value}</span>
            ))}
          </div>
        </article>
      );
    }

    return (
      <GalleryGrid
        {...optionalProps}
        ariaLabel={ariaLabel}
        empty={emptyMessage}
        filters={filters}
        items={items}
      >
        {renderItem}
      </GalleryGrid>
    );
  }

  FilterableWorkGallery.displayName = "FilterableWorkGallery";
  return FilterableWorkGallery;
}
