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

// Real club activities (see about.txt).
export const programs = [
  {
    title: "Junior Cricket & Coaching",
    description:
      "Club members serve as coaches and mentors, training and guiding young players through the Battle of the Everest schools rivalry and beyond.",
    icon: "sprout",
  },
  {
    title: "Competitive & League Cricket",
    description:
      "Competing in the Batticaloa District Cricket Association's A Division since 2009, alongside T20, ODI, and league tournaments.",
    icon: "shield",
  },
  {
    title: "Free Educational Support",
    description:
      "Free tuition classes for Grade 05 Scholarship Examination students, regardless of financial background.",
    icon: "cap",
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

// Real club history (see about.txt).
export const achievements = [
  { value: 8, suffix: "+", label: "Trophies Won" },
  { value: 11, suffix: "+", label: "Years of Rivalry" },
  { value: 17, suffix: "+", label: "Years in A Division" },
  { value: 12, suffix: "", label: "Founding Members" },
];
