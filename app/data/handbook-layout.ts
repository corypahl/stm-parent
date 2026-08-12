export type HandbookRosterRow = {
  name: string;
  role: string;
  email?: string;
};

export const handbookClergy = [
  { role: "Pastor", name: "Father Ryan Riley", email: "frryan@st-martha.org" },
  { role: "Assistant to the Pastor", name: "Father Mike Murray", email: "frmike@st-martha.org" },
];

export const handbookStaffRoster: HandbookRosterRow[] = [
  { name: "Mrs. Amanda Konopaska", role: "Principal", email: "akonopaska@st-martha.org" },
  { name: "Mrs. Cynthia Farnsworth", role: "School Secretary", email: "cfarnsworth@st-martha.org" },
  { name: "Mrs. Ellen Belloli", role: "Preschool Teacher", email: "ebelloli@st-martha.org" },
  { name: "Mrs. Sara Rivet", role: "Preschool Aide", email: "srivet@st-martha.org" },
  { name: "Mrs. Kara Lamke", role: "Kindergarten Teacher", email: "klamke@st-martha.org" },
  { name: "Mrs. Lilia Rampe", role: "Kindergarten Aide & Lunch/Recess", email: "lrampe@st-martha.org" },
  { name: "Miss Natalie Bertsch", role: "Kindergarten Aide & Lunch/Recess", email: "nbertsch@st-martha.org" },
  { name: "Mrs. Sara Ramereiz", role: "First Grade Teacher", email: "sramereiz@st-martha.org" },
  { name: "Mrs. Marisa Strom", role: "First Grade Aide and Lunch/Recess", email: "mstrom@st-martha.org" },
  { name: "Ms. Denise Zieleniewski", role: "First Grade Aide and Lunch/Recess", email: "dzieleniewski@st-martha.org" },
  { name: "Miss Karly Marth", role: "Second Grade Teacher", email: "kmarth@st-martha.org" },
  { name: "Mrs. Plaehn (Jacobs)", role: "Third Grade Teacher", email: "mjacobs@st-martha.org" },
  { name: "Mrs. Jodee Plefka", role: "Fourth Grade Teacher", email: "jplefka@st-martha.org" },
  { name: "Miss Dani Flint", role: "Fifth Grade Homeroom; Grades 5-8 Social Studies; Grades 5-6 Literature", email: "dflint@st-martha.org" },
  { name: "Mr. Andreas Quintus", role: "Sixth Grade Homeroom; Grades 4-8 Science; Grade 7 Literature", email: "aquintus@st-martha.org" },
  { name: "Mrs. Char Richardson", role: "Eighth Grade Homeroom; Grades 5-8 English; Grade 8 Literature & Religion; Grade 6 Religion", email: "crichardson@st-martha.org" },
  { name: "Mrs. Carolyn Hall", role: "Seventh Grade Homeroom (AM only); Grades 5-8 Math", email: "chall@st-martha.org" },
  { name: "Mrs. Ann Williams", role: "Academic Interventionist", email: "awilliams@st-martha.org" },
  { name: "Mrs. Cecelia Clark", role: "Spanish (K-8) and Music (K-8)", email: "cclark@st-martha.org" },
  { name: "Mrs. Julie Hanson", role: "Physical Education (K-8), STEM/Library K-8", email: "jhanson@st-martha.org" },
  { name: "Mrs. Liz Wylegala", role: "Visual Arts (K-8)", email: "lwylegala@st-martha-org" },
  { name: "Mrs. Wendy Muzzatti", role: "Technology (K-8)", email: "wmuzzatti@st-martha.org" },
  { name: "Mrs. Rebeca Ardis", role: "Violin & String Orchestra", email: "rardis@st-martha.org" },
  { name: "Lunch Supervision", role: "Lunch supervision", email: "lunch@st-martha.org" },
  { name: "Mrs. Maribeth Fletcher", role: "Kids Corner", email: "mfletcher@st-martha.org" },
  { name: "Mrs. Stephanie Moody", role: "Kids Corner", email: "smoody@st-martha.org" },
];

export const handbookHours = [
  ["Full school day", "8:00 a.m.-3:25 p.m."],
  ["Half school day", "8:00 a.m.-11:25 a.m."],
  ["Preschool & kindergarten full day", "8:00 a.m.-3:20 p.m."],
  ["Preschool & kindergarten half day", "8:00 a.m.-11:20 a.m."],
  ["Lunch & recess", "11:30 a.m.-12:20 p.m."],
  ["School office hours (Monday-Friday)", "7:45 a.m.-3:45 p.m."],
  ["Before school care", "7:20 a.m.-7:50 a.m."],
  ["After school care (Kids Corner)", "3:25 p.m.-6:00 p.m."],
];

export const tardinessRows = [
  ["5 minutes", "3 days of school", "18 lessons"],
  ["10 minutes", "7 days of school", "35 lessons"],
  ["15 minutes", "10 days of school", "50 lessons"],
  ["20 minutes", "14.5 days of school", "73 lessons"],
  ["30 minutes", "22 days of school", "110 lessons"],
];

export type UniformGroup = {
  title: string;
  groups: { heading: string; items: string[] }[];
};

export const uniformGroups: UniformGroup[] = [
  {
    title: "K-4 Girls",
    groups: [
      { heading: "Required uniform", items: [
        "Gray plaid jumper, no more than 1 inch above the knee.",
        "White Peter Pan collar blouse, short or long sleeve.",
        "Gray monogrammed cardigan, optional.",
        "MAPU hair accessories, optional.",
      ] },
      { heading: "Bottom options", items: [
        "Navy pants or shorts with a belt. A St. Martha polo or white short-sleeve Peter Pan collar blouse is permitted with shorts.",
        "Black or gray shorts or leggings should be worn under the skirt for modesty. No capris.",
      ] },
      { heading: "Belts & outerwear", items: [
        "Black, brown, or navy belt. An elastic belt with metal clasp is permitted; K-4 students are excused until their fine motor skills have developed.",
        "Optional winter turtleneck under the jumper.",
      ] },
      { heading: "Socks", items: ["Solid white, gray, navy, or black fold-over socks or tights with no logos or other colors."] },
      { heading: "Shoes", items: [
        "Black or gray Mary Janes with a maximum 1.5-inch heel, or black/gray athletic sneakers.",
        "Velcro or slip-ons are encouraged. No boots, high tops, multicolored shoes, or colored laces.",
      ] },
      { heading: "Physical education", items: ["Supportive anti-skid shoes in any color. No neon or light-up shoes. These remain at school."] },
    ],
  },
  {
    title: "5-8 Girls",
    groups: [
      { heading: "Required uniform", items: [
        "Gray plaid skirt, no more than 1 inch above the knee.",
        "St. Martha monogrammed polo, short or long sleeve.",
        "Maroon monogrammed vest, sweater, or cardigan for winter.",
        "MAPU hair accessories, optional.",
      ] },
      { heading: "Bottom options", items: [
        "Gray pants or shorts with a belt. A St. Martha polo or white short-sleeve Peter Pan collar blouse is permitted with shorts.",
        "Black or gray shorts or leggings should be worn under the skirt for modesty.",
      ] },
      { heading: "Belts & outerwear", items: ["Black, brown, or navy belt."] },
      { heading: "Socks", items: ["Solid white, gray, navy, or black fold-over socks with no logos or other colors."] },
      { heading: "Shoes", items: [
        "Black or gray Mary Janes with a maximum 1.5-inch heel, or black/gray athletic sneakers or slip-ons.",
        "No boots, high tops, multicolored shoes, or colored laces.",
      ] },
      { heading: "Physical education", items: [
        "Grades 6-8: MAPU PE uniform with a gray monogrammed shirt, maroon monogrammed shorts, and supportive athletic shoes.",
      ] },
    ],
  },
  {
    title: "K-4 Boys",
    groups: [
      { heading: "Required uniform", items: [
        "Navy pants or shorts with a belt.",
        "White polo, short or long sleeve, tucked in.",
        "Gray monogrammed vest or sweater for winter.",
      ] },
      { heading: "Belts & outerwear", items: ["Black, brown, or navy belt. An elastic belt with metal clasp is permitted; K-4 students are excused until their fine motor skills have developed."] },
      { heading: "Socks", items: ["Solid white, gray, navy, or black socks with no logos or other colors. No-show socks are not permitted."] },
      { heading: "Shoes", items: [
        "Black or gray athletic shoes. Velcro or slip-ons are encouraged.",
        "No boots, high tops, multicolored shoes, or colored laces. K-1 must wear Velcro straps or slip-ons only.",
      ] },
      { heading: "Physical education", items: ["Athletic shoes in any solid color. No neon or light-up shoes."] },
    ],
  },
  {
    title: "5-8 Boys",
    groups: [
      { heading: "Required uniform", items: [
        "Gray pants or shorts with a belt.",
        "White polo, short or long sleeve, tucked in.",
        "Maroon monogrammed vest or sweater for winter.",
      ] },
      { heading: "Belts & outerwear", items: ["Black, brown, or navy belt."] },
      { heading: "Socks", items: ["Solid white, gray, navy, or black socks with no logos or other colors. No-show socks are not permitted."] },
      { heading: "Shoes", items: ["Black or gray athletic shoes or slip-ons only, with no additional logos or colors. No boots, high tops, multicolored shoes, or colored laces."] },
      { heading: "Physical education", items: ["Grades 6-8: MAPU PE uniform with a gray monogrammed shirt, maroon monogrammed shorts, and supportive athletic shoes."] },
    ],
  },
];

export const majorBehaviorResponses = [
  {
    heading: "1st occurrence",
    text: "Teacher implements an appropriate logical consequence, reteaches expectations, documents the behavior, and communicates with parents. Administration may be involved depending on the severity of the incident.",
  },
  {
    heading: "Repeated behavior",
    text: "Principal discipline notice, parent contact, restorative conference, and appropriate school consequences, which may include loss of privileges, a behavior plan, detention, or suspension.",
  },
  {
    heading: "Continued or severe behavior",
    text: "Administrative intervention with a parent conference. Consequences may include in-school suspension, out-of-school suspension, a behavior contract, or other disciplinary action deemed appropriate by the principal. Law enforcement may be contacted when required by law or when safety is compromised.",
  },
];

export const kidsCornerFees = [
  ["Morning care: before school (per school year)", "$800", "$1,600", "$2,400"],
  ["Drop-in: after school care", "$17.50 per day/per student", "-", "-"],
  ["Drop-in: morning care", "$6 per day/per student", "-", "-"],
  ["After care (per school year)", "$2,600", "$4,400", "$6,200"],
];

export const handbookUpdatedInformation = [
  ["Page 8", "FACTS enrollment fee due July 1"],
  ["Page 13", "Smart watches"],
  ["Page 16", "Late arrivals on Thursdays"],
  ["Page 18", "Grades 5-8 missing and late work policy"],
  ["Page 18", "Spring conferences"],
  ["Page 20", "Logging volunteer hours in FACTS"],
  ["Page 21", "Family involvement structure"],
  ["Page 26", "Kids Corner pricing"],
  ["Page 29", "Bullying vs. conflict"],
  ["Page 32", "Monthly lunch selection information"],
  ["Page 37", "Major behavior response rubric"],
];
