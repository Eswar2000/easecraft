import { ScrollReveal } from "../scroll-reveal.js";

import {
  createScrollDrivenArticleTimeline,
  type ArticleTimelineRevealAdapterProps,
} from "./scroll-driven-article-timeline-core.js";

function RevealSection(props: ArticleTimelineRevealAdapterProps) {
  const {
    children,
    className,
    delay,
    elementRef,
    id,
    labelledBy,
    observerRoot,
    rootMargin,
    threshold,
  } = props;
  const optionalProps = {
    ...(className ? { className } : {}),
    ...(observerRoot !== undefined ? { observerRoot } : {}),
  };

  return (
    <ScrollReveal
      {...optionalProps}
      aria-labelledby={labelledBy}
      as="section"
      delay={delay}
      id={id}
      ref={elementRef}
      rootMargin={rootMargin}
      threshold={threshold}
    >
      {children}
    </ScrollReveal>
  );
}

export const ScrollDrivenArticleTimeline = createScrollDrivenArticleTimeline(RevealSection);

export type {
  ArticleTimelineSection,
  ArticleTimelineThreshold,
  ScrollDrivenArticleTimelineProps,
} from "./scroll-driven-article-timeline-core.js";
