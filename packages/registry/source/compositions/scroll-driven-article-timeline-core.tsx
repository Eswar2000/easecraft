import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentType,
  type ReactNode,
} from "react";

export type ArticleTimelineThreshold = number | readonly number[];

export interface ArticleTimelineSection {
  readonly content: ReactNode;
  readonly date?: ReactNode;
  readonly id: string;
  readonly label: string;
  readonly media?: ReactNode;
  readonly summary?: ReactNode;
  readonly title?: ReactNode;
}

export interface ArticleTimelineRevealAdapterProps {
  readonly children: ReactNode;
  readonly className?: string;
  readonly delay: number;
  readonly elementRef: (element: HTMLElement | null) => void;
  readonly id: string;
  readonly labelledBy: string;
  readonly observerRoot?: Element | Document | null;
  readonly rootMargin: string;
  readonly threshold: number;
}

export interface ScrollDrivenArticleTimelineProps {
  readonly activeRootMargin?: string;
  readonly activeSection?: string | undefined;
  readonly activeThreshold?: ArticleTimelineThreshold;
  readonly articleClassName?: string;
  readonly articleLabel?: string;
  readonly contentClassName?: string;
  readonly defaultActiveSection?: string;
  readonly indexClassName?: string;
  readonly mediaClassName?: string;
  readonly navClassName?: string;
  readonly navLabel?: string;
  readonly navLinkClassName?: string;
  readonly navListClassName?: string;
  readonly observerRoot?: Element | Document | null;
  readonly onActiveSectionChange?: (sectionId: string) => void;
  readonly revealRootMargin?: string;
  readonly revealThreshold?: number;
  readonly rootClassName?: string;
  readonly sectionClassName?: string;
  readonly sections: readonly ArticleTimelineSection[];
  readonly statusClassName?: string;
  readonly summaryClassName?: string;
  readonly titleClassName?: string;
}

interface SectionVisibility {
  readonly intersecting: boolean;
  readonly ratio: number;
  readonly top: number;
}

function normalizeThreshold(threshold: ArticleTimelineThreshold): number | number[] {
  if (typeof threshold === "number") {
    return Math.max(0, Math.min(1, threshold));
  }

  return [...new Set(threshold.map((value) => Math.max(0, Math.min(1, value))))].sort(
    (first, second) => first - second,
  );
}

function validateTimeline(
  sections: readonly ArticleTimelineSection[],
  activeSection: string | undefined,
  defaultActiveSection: string | undefined,
): ArticleTimelineSection {
  if (sections.length === 0) {
    throw new Error("ScrollDrivenArticleTimeline requires at least one section.");
  }

  const sectionIds = new Set<string>();
  sections.forEach((section) => {
    if (sectionIds.has(section.id)) {
      throw new Error(`ScrollDrivenArticleTimeline received a duplicate section id: ${section.id}`);
    }

    if (section.label.trim().length === 0) {
      throw new Error(`ScrollDrivenArticleTimeline section ${section.id} requires a label.`);
    }

    sectionIds.add(section.id);
  });

  for (const [name, value] of [
    ["activeSection", activeSection],
    ["defaultActiveSection", defaultActiveSection],
  ] as const) {
    if (value !== undefined && !sectionIds.has(value)) {
      throw new Error(
        `ScrollDrivenArticleTimeline ${name} references an unknown section: ${value}`,
      );
    }
  }

  const firstSection = sections[0];

  if (!firstSection) {
    throw new Error("ScrollDrivenArticleTimeline requires at least one section.");
  }

  return firstSection;
}

export function createScrollDrivenArticleTimeline(
  RevealSection: ComponentType<ArticleTimelineRevealAdapterProps>,
) {
  function ScrollDrivenArticleTimeline(props: ScrollDrivenArticleTimelineProps) {
    const controlled = Object.hasOwn(props, "activeSection");
    const {
      activeRootMargin = "-20% 0px -45% 0px",
      activeSection,
      activeThreshold = [0.1, 0.35, 0.65],
      articleClassName,
      articleLabel = "Article timeline",
      contentClassName,
      defaultActiveSection,
      indexClassName,
      mediaClassName,
      navClassName,
      navLabel = "Article sections",
      navLinkClassName,
      navListClassName,
      observerRoot = null,
      onActiveSectionChange,
      revealRootMargin = "0px 0px -12% 0px",
      revealThreshold = 0.15,
      rootClassName,
      sectionClassName,
      sections,
      statusClassName,
      summaryClassName,
      titleClassName,
    } = props;
    const firstSection = validateTimeline(sections, activeSection, defaultActiveSection);
    const [uncontrolledSection, setUncontrolledSection] = useState(
      () => defaultActiveSection ?? firstSection.id,
    );
    const requestedSection = controlled ? (activeSection ?? firstSection.id) : uncontrolledSection;
    const currentSection =
      sections.find((section) => section.id === requestedSection) ?? firstSection;
    const currentIndex = sections.indexOf(currentSection);
    const articleElementRef = useRef<HTMLElement>(null);
    const sectionElementsRef = useRef(new Map<string, HTMLElement>());
    const onActiveSectionChangeRef = useRef(onActiveSectionChange);
    const controlledRef = useRef(controlled);
    const currentSectionIdRef = useRef(currentSection.id);
    const observedSectionIdRef = useRef(currentSection.id);
    const sectionSignature = sections.map((section) => section.id).join("\u0000");

    useLayoutEffect(() => {
      onActiveSectionChangeRef.current = onActiveSectionChange;
      controlledRef.current = controlled;
      currentSectionIdRef.current = currentSection.id;
      observedSectionIdRef.current = currentSection.id;
    }, [controlled, currentSection.id, onActiveSectionChange]);

    function commitActiveSection(sectionId: string) {
      if (sectionId === currentSectionIdRef.current) {
        return;
      }

      currentSectionIdRef.current = sectionId;

      if (!controlledRef.current) {
        setUncontrolledSection(sectionId);
      }

      onActiveSectionChangeRef.current?.(sectionId);
    }

    useEffect(() => {
      if (typeof IntersectionObserver === "undefined") {
        return undefined;
      }

      const visibility = new Map<string, SectionVisibility>();
      const elements = sections.flatMap((section) => {
        const element = sectionElementsRef.current.get(section.id);
        return element ? [{ element, id: section.id }] : [];
      });

      if (elements.length === 0) {
        return undefined;
      }

      const sectionIdByElement = new Map(elements.map(({ element, id }) => [element, id]));
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            const sectionId = sectionIdByElement.get(entry.target as HTMLElement);

            if (sectionId) {
              visibility.set(sectionId, {
                intersecting: entry.isIntersecting,
                ratio: entry.intersectionRatio,
                top: entry.boundingClientRect.top,
              });
            }
          });

          const nextSection = sections
            .map((section, index) => ({ index, section, state: visibility.get(section.id) }))
            .filter(
              (entry): entry is typeof entry & { readonly state: SectionVisibility } =>
                entry.state?.intersecting === true,
            )
            .sort(
              (first, second) =>
                second.state.ratio - first.state.ratio ||
                Math.abs(first.state.top) - Math.abs(second.state.top) ||
                first.index - second.index,
            )[0]?.section;

          if (!nextSection || nextSection.id === observedSectionIdRef.current) {
            return;
          }

          observedSectionIdRef.current = nextSection.id;
          commitActiveSection(nextSection.id);
        },
        {
          root: observerRoot,
          rootMargin: activeRootMargin,
          threshold: normalizeThreshold(activeThreshold),
        },
      );

      elements.forEach(({ element }) => {
        observer.observe(element);
      });

      return () => {
        observer.disconnect();
      };
    }, [activeRootMargin, activeThreshold, observerRoot, sectionSignature, sections]);

    return (
      <div
        className={rootClassName}
        data-active-section={currentSection.id}
        data-easecraft-article-timeline=""
      >
        <nav aria-label={navLabel} className={navClassName} data-easecraft-timeline-nav="">
          <ol className={navListClassName} data-easecraft-timeline-nav-list="">
            {sections.map((section, index) => {
              const active = section.id === currentSection.id;

              return (
                <li data-active={active ? true : undefined} key={section.id}>
                  <a
                    aria-current={active ? "location" : undefined}
                    className={navLinkClassName}
                    data-easecraft-timeline-nav-link=""
                    href={`#${section.id}`}
                    onClick={(event) => {
                      event.preventDefault();
                      event.currentTarget.focus({ preventScroll: true });
                      const article = articleElementRef.current;
                      const target = sectionElementsRef.current.get(section.id);

                      if (article && target) {
                        article.scrollTo({
                          top:
                            article.scrollTop +
                            target.getBoundingClientRect().top -
                            article.getBoundingClientRect().top,
                        });
                      }

                      observedSectionIdRef.current = section.id;
                      commitActiveSection(section.id);
                    }}
                  >
                    <span aria-hidden="true" data-easecraft-timeline-nav-index="">
                      {(index + 1).toString().padStart(2, "0")}
                    </span>
                    <span>{section.label}</span>
                  </a>
                </li>
              );
            })}
          </ol>
        </nav>
        <p
          aria-atomic="true"
          aria-live="polite"
          className={statusClassName}
          data-easecraft-timeline-status=""
          role="status"
        >
          Section {(currentIndex + 1).toString()} of {sections.length.toString()}:{" "}
          {currentSection.label}
        </p>
        <article
          aria-label={articleLabel}
          className={articleClassName}
          data-easecraft-timeline-article=""
          ref={articleElementRef}
        >
          {sections.map((section, index) => {
            const titleId = `easecraft-timeline-${section.id}-title`;

            return (
              <RevealSection
                {...(sectionClassName ? { className: sectionClassName } : {})}
                delay={Math.min(index * 60, 240)}
                elementRef={(element) => {
                  if (element) {
                    sectionElementsRef.current.set(section.id, element);
                  } else {
                    sectionElementsRef.current.delete(section.id);
                  }
                }}
                id={section.id}
                key={section.id}
                labelledBy={titleId}
                observerRoot={observerRoot}
                rootMargin={revealRootMargin}
                threshold={revealThreshold}
              >
                <header data-easecraft-timeline-section-header="">
                  <span
                    aria-hidden="true"
                    className={indexClassName}
                    data-easecraft-timeline-section-index=""
                  >
                    {(index + 1).toString().padStart(2, "0")}
                  </span>
                  {section.date ? (
                    <p data-easecraft-timeline-section-date="">{section.date}</p>
                  ) : null}
                  <h2 className={titleClassName} id={titleId}>
                    {section.title ?? section.label}
                  </h2>
                  {section.summary ? (
                    <p className={summaryClassName} data-easecraft-timeline-section-summary="">
                      {section.summary}
                    </p>
                  ) : null}
                </header>
                {section.media ? (
                  <div className={mediaClassName} data-easecraft-timeline-section-media="">
                    {section.media}
                  </div>
                ) : null}
                <div className={contentClassName} data-easecraft-timeline-section-content="">
                  {section.content}
                </div>
              </RevealSection>
            );
          })}
        </article>
      </div>
    );
  }

  ScrollDrivenArticleTimeline.displayName = "ScrollDrivenArticleTimeline";
  return ScrollDrivenArticleTimeline;
}
