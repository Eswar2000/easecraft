import { AnimatedAccordion } from "../animated-accordion.js";

import {
  createExpandableProjectCard,
  type ProjectAccordionAdapterProps,
} from "./expandable-project-card-core.js";

interface ProjectItem {
  readonly id: string;
  readonly label: ProjectAccordionAdapterProps["label"];
}

function getProjectValue(project: ProjectItem) {
  return project.id;
}

function getProjectLabel(project: ProjectItem) {
  return project.label;
}

function ProjectAccordion(props: ProjectAccordionAdapterProps) {
  const {
    bodyClassName,
    children,
    contentClassName,
    controlled,
    defaultExpanded,
    expanded,
    headerClassName,
    headingLevel,
    itemClassName,
    label,
    onExpandedChange,
    projectId,
    triggerClassName,
  } = props;
  const item = { id: projectId, label };
  const optionalClassProps = {
    ...(bodyClassName ? { bodyClassName } : {}),
    ...(contentClassName ? { contentClassName } : {}),
    ...(headerClassName ? { headerClassName } : {}),
    ...(itemClassName ? { itemClassName } : {}),
    ...(triggerClassName ? { triggerClassName } : {}),
  };
  const sharedProps = {
    ...optionalClassProps,
    getLabel: getProjectLabel,
    getValue: getProjectValue,
    headingLevel,
    items: [item],
    onValueChange: (value: string | undefined) => {
      onExpandedChange?.(value !== undefined);
    },
  };

  if (controlled) {
    return (
      <AnimatedAccordion<ProjectItem> {...sharedProps} value={expanded ? projectId : undefined}>
        {() => children}
      </AnimatedAccordion>
    );
  }

  return (
    <AnimatedAccordion<ProjectItem>
      {...sharedProps}
      {...(defaultExpanded ? { defaultValue: projectId } : {})}
    >
      {() => children}
    </AnimatedAccordion>
  );
}

export const ExpandableProjectCard = createExpandableProjectCard(ProjectAccordion);

export type {
  ExpandableProject,
  ExpandableProjectCardProps,
} from "./expandable-project-card-core.js";
