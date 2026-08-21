export const siteConfig = {
  name: "Kallar Central Sports Club",
  shortName: "KCSC",
  tagline: "Where Cricket Builds Champions.",
  description:
    "Kallar Central Sports Club brings together passionate cricketers, experienced coaches, competitive teams, and a community committed to developing the next generation of players.",
};

export const navLinks = [
  { label: "Home", href: "/#home" },
  { label: "About", href: "/about" },
  { label: "Gallery", href: "/gallery" },
  { label: "News", href: "/news" },
];

// Real club facts (see about.txt): founded 2007, 170+ members, 8+ trophies
// (B Division Champion Cup plus 1st/2nd/3rd place cups across T20/ODI play).
export const clubStats = [
  { value: 19, suffix: "+", label: "Years of Cricket" },
  { value: 170, suffix: "+", label: "Players & Members" },
  { value: 8, suffix: "+", label: "Championships" },
];

export const programs = [
  {
    title: "Junior Cricket",
    description:
      "Developing young players through structured coaching and competitive experience.",
    icon: "sprout",
  },
  {
    title: "High Performance",
    description:
      "Advanced training for players committed to taking their game further.",
    icon: "target",
  },
  {
    title: "Competitive Cricket",
    description:
      "Represent the club, compete with purpose, and play for the badge.",
    icon: "shield",
  },
];

// placeholder — replace with real club teams
export const teams = [
  {
    name: "Senior Team",
    description: "The club's first XI, competing at the top level of local league cricket.",
  },
  {
    name: "Youth Team",
    description: "Rising talent building match experience in age-group competition.",
  },
  {
    name: "Development Squad",
    description: "The pathway program for players progressing toward senior selection.",
  },
];

// placeholder — replace with real club history
export const achievements = [
  { value: 20, suffix: "+", label: "Championships" },
  { value: 300, suffix: "+", label: "Players Developed" },
  { value: 8, suffix: "", label: "Active Teams" },
  { value: 50, suffix: "+", label: "Years of Legacy" },
];
