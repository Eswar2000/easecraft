"use client";

import type { CompositionSlug } from "easecraft-registry";

import { RegistryDeliveryPanel } from "../../registry-delivery/registry-delivery-panel";
import type { CompositionDeliverySources } from "./composition-delivery-types";

interface CompositionDeliveryPanelProps {
  readonly slug: CompositionSlug;
  readonly sources: CompositionDeliverySources;
}

export function CompositionDeliveryPanel({ slug, sources }: CompositionDeliveryPanelProps) {
  return <RegistryDeliveryPanel kind="composition" slug={slug} sources={sources} />;
}
