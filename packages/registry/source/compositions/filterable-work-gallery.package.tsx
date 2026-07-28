import { FilterGrid, type FilterGridFilter } from "easecraft";

import {
  createFilterableWorkGallery,
  type FilterableWorkItem,
  type WorkGalleryGridAdapterProps,
} from "./filterable-work-gallery-core.js";

function getWorkKey(item: FilterableWorkItem) {
  return item.id;
}

function GalleryGrid(props: WorkGalleryGridAdapterProps) {
  const {
    ariaLabel,
    children,
    controlClassName,
    controlsClassName,
    defaultValue,
    empty,
    emptyClassName,
    filters,
    galleryClassName,
    gridClassName,
    items,
    onValueChange,
    resultClassName,
    value,
  } = props;
  const optionalProps = {
    ...(controlClassName ? { controlClassName } : {}),
    ...(controlsClassName ? { controlsClassName } : {}),
    ...(defaultValue !== undefined ? { defaultValue } : {}),
    ...(emptyClassName ? { emptyClassName } : {}),
    ...(galleryClassName ? { className: galleryClassName } : {}),
    ...(gridClassName ? { gridClassName } : {}),
    ...(onValueChange ? { onValueChange } : {}),
    ...(resultClassName ? { resultClassName } : {}),
    ...(value !== undefined ? { value } : {}),
  };

  return (
    <FilterGrid<FilterableWorkItem>
      {...optionalProps}
      aria-label={ariaLabel}
      controlsLabel={ariaLabel}
      empty={empty}
      filters={filters satisfies readonly FilterGridFilter<FilterableWorkItem>[]}
      getKey={getWorkKey}
      items={items}
      resultLabel={(count) => `${count.toString()} ${count === 1 ? "project" : "projects"}`}
    >
      {children}
    </FilterGrid>
  );
}

export const FilterableWorkGallery = createFilterableWorkGallery(GalleryGrid);

export type {
  FilterableWorkCategory,
  FilterableWorkGalleryProps,
  FilterableWorkItem,
  FilterableWorkItemState,
} from "./filterable-work-gallery-core.js";
