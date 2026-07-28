import { type ComponentType, type ReactNode } from "react";

export interface ExpandableProject {
  readonly id: string;
  readonly meta?: ReactNode;
  readonly status?: ReactNode;
  readonly summary: ReactNode;
  readonly title: ReactNode;
}

export interface ExpandableProjectCardProps {
  readonly actions?: ReactNode;
  readonly articleClassName?: string;
  readonly bodyClassName?: string;
  readonly children: ReactNode;
  readonly contentClassName?: string;
  readonly defaultExpanded?: boolean;
  readonly expanded?: boolean | undefined;
  readonly headerClassName?: string;
  readonly headingLevel?: 2 | 3 | 4 | 5 | 6;
  readonly itemClassName?: string;
  readonly onExpandedChange?: (expanded: boolean) => void;
  readonly project: ExpandableProject;
  readonly triggerClassName?: string;
}

export interface ProjectAccordionAdapterProps {
  readonly bodyClassName?: string;
  readonly children: ReactNode;
  readonly contentClassName?: string;
  readonly controlled: boolean;
  readonly defaultExpanded: boolean;
  readonly expanded: boolean;
  readonly headerClassName?: string;
  readonly headingLevel: 2 | 3 | 4 | 5 | 6;
  readonly itemClassName?: string;
  readonly label: ReactNode;
  readonly onExpandedChange?: (expanded: boolean) => void;
  readonly projectId: string;
  readonly triggerClassName?: string;
}

export function createExpandableProjectCard(
  ProjectAccordion: ComponentType<ProjectAccordionAdapterProps>,
) {
  function ExpandableProjectCard(props: ExpandableProjectCardProps) {
    const controlled = Object.hasOwn(props, "expanded");
    const {
      actions,
      articleClassName,
      bodyClassName,
      children,
      contentClassName,
      defaultExpanded = false,
      expanded = false,
      headerClassName,
      headingLevel = 3,
      itemClassName,
      onExpandedChange,
      project,
      triggerClassName,
    } = props;
    const optionalClassProps = {
      ...(bodyClassName ? { bodyClassName } : {}),
      ...(contentClassName ? { contentClassName } : {}),
      ...(headerClassName ? { headerClassName } : {}),
      ...(itemClassName ? { itemClassName } : {}),
      ...(triggerClassName ? { triggerClassName } : {}),
    };

    return (
      <article
        className={articleClassName}
        data-easecraft-expandable-project=""
        data-project-id={project.id}
      >
        <ProjectAccordion
          {...optionalClassProps}
          controlled={controlled}
          defaultExpanded={defaultExpanded}
          expanded={expanded}
          headingLevel={headingLevel}
          label={
            <span data-easecraft-project-heading="">
              <span data-easecraft-project-title="">{project.title}</span>
              {project.summary ? (
                <span data-easecraft-project-summary="">{project.summary}</span>
              ) : null}
              {project.meta ? <span data-easecraft-project-meta="">{project.meta}</span> : null}
              {project.status ? (
                <span data-easecraft-project-status="">{project.status}</span>
              ) : null}
            </span>
          }
          {...(onExpandedChange ? { onExpandedChange } : {})}
          projectId={project.id}
        >
          <div data-easecraft-project-details="">{children}</div>
          {actions ? <div data-easecraft-project-actions="">{actions}</div> : null}
        </ProjectAccordion>
      </article>
    );
  }

  ExpandableProjectCard.displayName = "ExpandableProjectCard";
  return ExpandableProjectCard;
}
