export interface DurationTokens {
  readonly instant: number;
  readonly fast: number;
  readonly normal: number;
  readonly slow: number;
}

export interface DistanceTokens {
  readonly small: number;
  readonly medium: number;
  readonly large: number;
}

export interface StaggerTokens {
  readonly tight: number;
  readonly normal: number;
  readonly relaxed: number;
}

export interface EasingTokens {
  readonly enter: string;
  readonly exit: string;
  readonly move: string;
  readonly emphasized: string;
}

export interface MotionTokens {
  readonly duration: DurationTokens;
  readonly distance: DistanceTokens;
  readonly stagger: StaggerTokens;
  readonly easing: EasingTokens;
}

export type MotionTokenOverrides = {
  readonly [Group in keyof MotionTokens]?: Partial<MotionTokens[Group]>;
};

export const defaultMotionTokens = {
  duration: {
    instant: 100,
    fast: 180,
    normal: 300,
    slow: 600,
  },
  distance: {
    small: 4,
    medium: 12,
    large: 24,
  },
  stagger: {
    tight: 25,
    normal: 60,
    relaxed: 100,
  },
  easing: {
    enter: "out(3)",
    exit: "in(2)",
    move: "inOut(3)",
    emphasized: "out(5)",
  },
} as const satisfies MotionTokens;

export function resolveMotionTokens(overrides: MotionTokenOverrides = {}): MotionTokens {
  return {
    duration: { ...defaultMotionTokens.duration, ...overrides.duration },
    distance: { ...defaultMotionTokens.distance, ...overrides.distance },
    stagger: { ...defaultMotionTokens.stagger, ...overrides.stagger },
    easing: { ...defaultMotionTokens.easing, ...overrides.easing },
  };
}
