import type { Metadata } from "next";

import { CompositionExplorer } from "./composition-explorer";

export const metadata: Metadata = {
  title: "Compositions | Easecraft",
  description: "Accessible, installable motion workflows assembled from Easecraft components.",
};

export default function CompositionsPage() {
  return <CompositionExplorer />;
}
