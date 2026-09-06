// A stint is one continuous title at an org. Most roles have exactly one; a
// conversion (internship into full-time) is the same org with two.
export type Stint = {
  title: string;
  kind?: string;
  period: string;
};

export type Role = {
  org: string;
  orgHref: string;
  location: string;
  // Newest first.
  stints: Stint[];
  note: string;
  link?: { label: string; href: string };
};

export const experience: Role[] = [
  {
    org: "AfterQuery",
    orgHref: "https://afterquery.com",
    location: "San Francisco, CA",
    stints: [
      { title: "Software Engineer", kind: "Full-time", period: "Sep 2026 – Present" },
      { title: "Software Engineer", kind: "Internship", period: "Dec 2025 – Sep 2026" },
    ],
    note: "RL environments, evals, infrastructure.",
    link: { label: "lmarcade.com", href: "https://lmarcade.com" },
  },
  {
    org: "International Online Crime Coordination Center",
    orgHref: "https://ioc3.org",
    location: "Remote",
    stints: [
      {
        title: "Software Engineer Volunteer",
        kind: "Internship",
        period: "Jun 2025 – Sep 2025",
      },
    ],
    note: "Built internal investigation tooling and trained models.",
  },
  {
    org: "Uber",
    orgHref: "https://uber.com",
    location: "Remote",
    stints: [
      {
        title: "Software Engineer Fellow",
        kind: "Apprenticeship",
        period: "Nov 2024 – Sep 2025",
      },
    ],
    note: "Mentorship and interview prep with Uber engineers.",
  },
  {
    org: "ego (YC W24)",
    orgHref: "https://egoai.com",
    location: "San Francisco, CA",
    stints: [
      {
        title: "Software Engineer Intern",
        kind: "Internship",
        period: "Nov 2024 – Mar 2025",
      },
    ],
    note: "Taught AI to play games. AI native games.",
  },
];

const DASH = " – ";

// The whole time at the org: first stint's start through the newest one's end.
export function tenure(role: Role) {
  const stints = role.stints;
  const [start] = stints[stints.length - 1].period.split(DASH);
  const end = stints[0].period.split(DASH).at(-1);
  return `${start}${DASH}${end}`;
}

// Whatever every stint agrees on belongs to the org, not to each row.
export function meta(role: Role) {
  const [first] = role.stints;
  const oneStint = role.stints.length === 1;
  const oneTitle = new Set(role.stints.map((s) => s.title)).size === 1;

  return [
    oneStint || oneTitle ? first.title : null,
    oneStint ? first.kind : null,
    role.location,
  ]
    .filter(Boolean)
    .join(" · ");
}

// Only what tells the stints apart. Empty for a role that never changed shape.
export function stintRows(role: Role) {
  if (role.stints.length === 1) return [];
  const oneTitle = new Set(role.stints.map((s) => s.title)).size === 1;

  return role.stints.map((stint) => ({
    label: [oneTitle ? null : stint.title, stint.kind].filter(Boolean).join(" · "),
    period: stint.period,
  }));
}
