import type { ComponentSlug } from "easecraft-registry";

import { getComponentDeliverySources } from "../registry-delivery/delivery-source";
import { RegistryDeliveryPanel } from "../registry-delivery/registry-delivery-panel";

interface ComponentDeliveryPanelProps {
  readonly slug: ComponentSlug;
}

export function ComponentDeliveryPanel({ slug }: ComponentDeliveryPanelProps) {
  return (
    <RegistryDeliveryPanel
      kind="component"
      slug={slug}
      sources={getComponentDeliverySources(slug)}
    />
  );
}
