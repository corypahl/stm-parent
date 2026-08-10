export type HandbookRosterRow = {
  names: string[];
  room: string;
  role: string;
  email?: string;
};

export const handbookClergy = [
  { role: "Pastor", name: "Father Ryan Riley", email: "frryan@st-martha.org" },
  { role: "Assistant to the Pastor", name: "Father Mike Murray", email: "frmike@st-martha.org" },
];

export const handbookStaffRoster: HandbookRosterRow[] = [
  { names: ["Mrs. Patton"], room: "School Office", role: "Principal", email: "apatton@st-martha.org" },
  { names: ["Mrs. Farnsworth"], room: "School Office", role: "Administrative Assistant", email: "cfarnsworth@st-martha.org" },
  { names: ["Mrs. Belloli"], room: "116", role: "Preschool", email: "ebelloli@st-martha.org" },
  { names: ["Mrs. Lamke"], room: "118", role: "Kindergarten", email: "klamke@st-martha.org" },
  { names: ["Mrs. Marth"], room: "115", role: "First Grade", email: "kmarth@st-martha.org" },
  { names: ["Mrs. Vallejo"], room: "105", role: "Second Grade", email: "mvallejo@st-martha.org" },
  { names: ["Miss Jacobs"], room: "101", role: "Third Grade", email: "mjacobs@st-martha.org" },
  { names: ["Mrs. Plefka"], room: "103", role: "Fourth Grade", email: "jplefka@st-martha.org" },
  { names: ["Mr. Quintus"], room: "206", role: "Fifth Grade Homeroom; Grades 4-8 Science; Grade 7 Literature", email: "aquintus@st-martha.org" },
  { names: ["Mrs. Richardson"], room: "204", role: "Eighth Grade Homeroom; Grades 5-8 English; Grade 8 Literature and Religion", email: "crichardson@st-martha.org" },
  { names: ["Miss Flint"], room: "208", role: "Sixth Grade Homeroom; Grades 5-8 Social Studies; Grades 5-6 Literature", email: "atahaney@st-martha.org" },
  { names: ["Mrs. C. Hall"], room: "207", role: "Seventh Grade Homeroom (AM only); Grades 5-8 Math", email: "chall@st-martha.org" },
  { names: ["Mrs. Burkhardt"], room: "207", role: "Seventh Grade Homeroom (PM only); Grades 5-7 Religion", email: "hburkhardt@st-martha.org" },
  { names: ["Mrs. Williams"], room: "Parish Hall", role: "Academic Interventionist", email: "awilliams@st-martha.org" },
  { names: ["Mrs. Clark"], room: "Parish Hall", role: "Spanish (K-8); Music (K-8)", email: "cclark@st-martha.org" },
  { names: ["Mrs. Hanson"], room: "Gym", role: "Physical Education (K-8); STEM/Library (K-8)", email: "jhanson@st-martha.org" },
  { names: ["Mrs. Wylegala"], room: "Parish Hall", role: "Visual Arts (K-8)", email: "wylegalaliz@aol.com" },
  { names: ["Mrs. Muzzatti"], room: "Media Center", role: "Technology (K-8)", email: "wmuzzatti@st-martha.org" },
  { names: ["Mrs. Ardis"], room: "102", role: "Violin", email: "rardis@st-martha.org" },
  { names: ["Mrs. Finnerty"], room: "", role: "Teacher mentor" },
  { names: ["Mrs. Morgan", "Mrs. Rivet", "Miss Lopez", "Mrs. Rampe", "Miss Flamini"], room: "Preschool-2", role: "Preschool and Elementary School Aides and Playground Supervisors" },
  { names: ["Ashley Sheer"], room: "Cafeteria", role: "Lunchroom Supervisor" },
  { names: ["Mrs. Fletcher"], room: "", role: "Kids Corner Supervisor" },
];

export const handbookHours = [
  ["Before School Care", "7:20 A.M. - 7:50 A.M."],
  ["School Day", "8:00 A.M. - 3:25 P.M."],
  ["After School Care", "3:25 P.M. - 6:00 P.M."],
  ["Half Day Preschool", "8:00 A.M. - 11:30 A.M."],
  ["Full Day Preschool", "8:00 A.M. - 3:15 P.M."],
  ["Lunch/Recess", "11:25 A.M. - 12:20 P.M."],
  ["School Office Hours", "7:45 A.M. - 3:45 P.M."],
];

export const tardinessRows = [
  ["5 minutes", "3 days from school", "18 lessons"],
  ["10 minutes", "7 days from school", "35 lessons"],
  ["15 minutes", "10 days from school", "50 lessons"],
  ["20 minutes", "14.5 days from school", "73 lessons"],
  ["30 minutes", "22 days from school", "110 lessons"],
];

export type UniformGroup = {
  title: string;
  groups: { heading: string; items: string[] }[];
};

export const uniformGroups: UniformGroup[] = [
  {
    title: "K-4 Girls",
    groups: [
      { heading: "Purchase from MAPU", items: [
        "Gray plaid jumper hemmed to no higher than 1 inch above the knee.",
        "White blouse with Peter Pan collar, short or long sleeve.",
        "Gray monogrammed vest or sweater for the winter uniform with pants.",
        "Gray monogrammed cardigan, optional with jumper but recommended.",
        "MAPU hair accessories, optional.",
      ] },
      { heading: "Pants/shorts option", items: [
        "Navy pants or shorts with a black, brown, or navy belt. Shorts are summer/spring uniform only.",
        "Wear with a St. Martha polo or white short-sleeve blouse with Peter Pan collar.",
      ] },
      { heading: "Purchase anywhere", items: [
        "Black, brown, or navy belt. Elastic with metal clasp is permitted for K-4. Kindergarten students are excused until their motor skills have developed.",
        "White turtleneck to wear under jumper.",
        "Black/gray shorts or leggings to wear under the jumper for modesty.",
        "Solid white, gray, navy, or black ankle or fold-over socks or tights. No footie, no-show, or other-color socks.",
        "Simple gray, maroon, black, or white hair accessories, optional.",
        "Black or gray Mary Jane shoes with buckle or elastic strap, or black/gray athletic sneakers. No multicolored shoes, colored laces, high tops, or boots.",
        "Kindergarten and grade 1: Velcro straps or slip-ons; no laces.",
      ] },
      { heading: "PE class", items: ["Supportive anti-skid shoes in any color. No neon or light-up shoes. These remain at school."] },
    ],
  },
  {
    title: "5-8 Girls",
    groups: [
      { heading: "Purchase from MAPU", items: [
        "Gray plaid skirt hemmed to no higher than 1 inch above the knee.",
        "Long- or short-sleeve monogrammed polo, or short-sleeve oxford shirt, tucked in.",
        "Maroon monogrammed vest or cardigan, required for the winter uniform.",
        "MAPU hair accessories, optional.",
      ] },
      { heading: "Pants/shorts option", items: [
        "Gray pants or shorts with a black, brown, or navy belt. Shorts are summer/spring uniform only.",
        "Wear with a St. Martha polo or white short-sleeve blouse with Peter Pan collar.",
      ] },
      { heading: "Purchase anywhere", items: [
        "Black, brown, or gray belt, worn with a tucked-in shirt.",
        "Black/gray shorts or leggings to wear under the jumper for modesty.",
        "Solid white, gray, navy, or black ankle or fold-over socks or tights. No footie, no-show, or other-color socks.",
        "Simple gray, maroon, black, or white hair accessories, optional.",
        "Black or gray Mary Jane shoes with buckle or elastic strap, or black/gray athletic sneakers or slip-ons. No multicolored shoes, colored laces, high tops, or boots.",
      ] },
      { heading: "PE class", items: [
        "Supportive anti-skid shoes in any color. No neon or light-up shoes.",
        "Grades 6-8: Long- or short-sleeve gray monogrammed T-shirt and monogrammed maroon shorts must be purchased from MAPU.",
      ] },
    ],
  },
  {
    title: "K-4 Boys",
    groups: [
      { heading: "Purchase from MAPU", items: [
        "Navy pants or shorts with a black, brown, or navy belt. Shorts are summer/spring uniform only.",
        "Short- or long-sleeve white polo, tucked in at all times.",
        "Gray monogrammed vest or sweater for the winter uniform.",
      ] },
      { heading: "Purchase anywhere", items: [
        "Black, brown, or navy belt. Elastic with metal clasp is permitted for K-4. Kindergarten students are excused until their motor skills have developed.",
        "Solid white, gray, navy, or black ankle or crew socks. No footie, no-show, or other-color socks.",
        "All-black or all-gray athletic or slip-on shoes. No multicolored shoes, colored laces, high tops, or boots.",
        "Kindergarten and grade 1: Velcro straps or slip-ons; no laces.",
      ] },
      { heading: "PE class", items: ["Supportive athletic, anti-skid shoes in any color. No neon or light-up shoes. These remain at school."] },
    ],
  },
  {
    title: "5-8 Boys",
    groups: [
      { heading: "Purchase from MAPU", items: [
        "Gray pants or shorts with a black, brown, or navy belt. Shorts are summer/spring uniform only.",
        "Short- or long-sleeve white polo, tucked in at all times.",
        "Maroon monogrammed vest or sweater for the winter uniform.",
      ] },
      { heading: "Purchase anywhere", items: [
        "Black, brown, or gray belt, worn with a tucked-in shirt.",
        "Solid white, gray, navy, or black ankle or crew socks. No footie, no-show, or other-color socks.",
        "All-black or all-gray athletic or slip-on shoes. No multicolored shoes, colored laces, high tops, or boots.",
      ] },
      { heading: "PE class", items: [
        "Supportive athletic, anti-skid shoes in any color. No neon or light-up shoes.",
        "Grades 6-8: Long- or short-sleeve gray monogrammed T-shirt and monogrammed maroon shorts must be purchased from MAPU.",
      ] },
    ],
  },
];

export type ConsequenceMatrix = {
  title: string;
  columns: string[];
  rows: { grade: string; consequences: string[][] }[];
};

export const consequenceMatrices: Record<"severe" | "rough" | "language", ConsequenceMatrix> = {
  severe: {
    title: "Severe physical aggression consequences by grade level",
    columns: ["1st offense", "2nd offense", "3rd offense", "4th offense"],
    rows: [
      { grade: "K-1", consequences: [
        ["Time out", "Parent contact (Notice of Concern)", "Office referral"],
        ["Loss of privileges", "Written/drawn reflection", "Office referral", "Parent meeting with teacher", "Behavior contract"],
        ["Immediate removal from class", "Written/drawn reflection", "Office referral", "Parent meeting with teacher and principal", "Behavior contract"],
        ["Out-of-school suspension (1 day)", "Counseling referral", "Possible removal from school"],
      ] },
      { grade: "2-4", consequences: [
        ["Lunch/recess detention", "Parent contact (Notice of Concern)", "Office referral", "Written/drawn reflection", "Loss of privilege"],
        ["Immediate removal from class - sent home for the rest of the day", "1-day in-school suspension", "Written/drawn reflection", "Office referral", "Parent meeting with teacher", "Behavior contract"],
        ["Immediate removal from class - sent home for the rest of the day", "Out-of-school suspension (1 day)", "Parent meeting with teacher and principal", "Written/drawn reflection", "Behavior contract", "Counseling referral"],
        ["Immediate removal from class - sent home for the rest of the day", "Out-of-school suspension (2-3 days)", "Written/drawn reflection", "Parent meeting with teacher, principal, and pastor", "Counseling referral", "Possible removal from school"],
      ] },
      { grade: "5-8", consequences: [
        ["Parent contact (Notice of Concern)", "Office referral", "7:15 A.M. detention", "Written reflection"],
        ["Immediate removal from class - sent home for the rest of the day", "1-day in-school suspension", "Written reflection", "Office referral", "Parent meeting with teacher", "Behavior contract"],
        ["Immediate removal from class - sent home for the rest of the day", "Out-of-school suspension (1 day)", "Written reflection", "Office referral", "Parent meeting with teacher and principal"],
        ["Immediate removal from class - sent home for the rest of the day", "Out-of-school suspension (2-3 days)", "Parent meeting with teacher, principal, and pastor", "Counseling referral", "Possible removal from school"],
      ] },
    ],
  },
  rough: {
    title: "Rough play and unsafe physical contact consequences by grade level",
    columns: ["1st offense", "2nd offense", "3rd offense", "4th+ offense"],
    rows: [
      { grade: "K-1", consequences: [
        ["Redirection", "Warning", "Discussion with teacher"],
        ["Time out", "Parent contact (Notice of Concern)", "Written or drawn reflection"],
        ["Removal from activity", "Loss of recess", "Parent contact (Notice of Concern)", "Written or drawn reflection", "Behavior contract"],
        ["Removal from activity", "Loss of 2 recesses", "Parent contact (Notice of Concern)", "Written or drawn reflection", "Behavior contract"],
      ] },
      { grade: "2-4", consequences: [
        ["Redirection", "Warning", "Discussion with teacher"],
        ["Removal from activity", "Time out and/or loss of recess or activity time", "Parent contact (Notice of Concern)", "Written or drawn reflection"],
        ["Removal from activity", "Time out and lunch detention", "Parent contact (Notice of Concern)", "Written or drawn reflection", "Behavior contract"],
        ["Removal from activity and from class for remainder of the day", "Time out and lunch detention", "Parent contact (Notice of Concern)", "Written or drawn reflection", "Behavior contract"],
      ] },
      { grade: "5-8", consequences: [
        ["Removal from activity", "Warning", "Discussion with teacher"],
        ["Removal from activity", "Lunch detention", "Parent contact (Notice of Concern)", "Written reflection"],
        ["Removal from activity", "Office referral", "Parent contact (Notice of Concern)", "7:15 A.M. detention", "Written reflection", "Behavior contract"],
        ["Treated as physical aggression", "Immediate removal from class - sent home for the rest of the day", "7:15 A.M. detention (3 days)", "Written reflection", "Parent meeting with teacher and principal", "Behavior contract"],
      ] },
    ],
  },
  language: {
    title: "Discriminatory or offensive language consequences by grade level",
    columns: ["1st offense", "2nd offense", "3rd offense", "4th offense"],
    rows: [
      { grade: "K-1", consequences: [
        ["Discussion with teacher", "Parent contact (Notice of Concern)"],
        ["Loss of privileges", "Parent contact (Notice of Concern)", "Office referral"],
        ["Loss of privileges", "Parent contact (Notice of Concern)", "Office referral", "Behavior contract"],
        ["Loss of privileges", "Parent contact (Notice of Concern)", "Office referral", "Behavior contract", "Parent meeting with teacher and principal", "Counseling referral", "Possible removal from school"],
      ] },
      { grade: "2-4", consequences: [
        ["Discussion with teacher", "Parent contact (Notice of Concern)", "Written or drawn reflection"],
        ["Loss of privileges", "Parent contact (Notice of Concern)", "Office referral"],
        ["Two lunch/recess detentions", "Parent contact (Notice of Concern)", "Office referral", "Behavior contract"],
        ["Loss of privileges", "Parent contact (Notice of Concern)", "Office referral", "In-school suspension", "Behavior contract", "Parent meeting with teacher and principal", "Counseling referral", "Possible removal from school"],
      ] },
      { grade: "5-8", consequences: [
        ["Discussion with teacher", "Office referral", "Parent contact (Notice of Concern)", "7:15 A.M. detention", "Written reflection"],
        ["Office referral", "Parent contact (Notice of Concern)", "7:15 A.M. detentions (3)", "Written reflection"],
        ["Office referral", "Parent contact (Notice of Concern)", "In-school suspension", "Written reflection", "Parent meeting with teacher and principal", "Behavior contract"],
        ["Office referral", "Parent contact (Notice of Concern)", "Out-of-school suspension", "Parent meeting with teacher and principal", "Behavior contract", "Counseling referral", "Possible removal from school"],
      ] },
    ],
  },
};

export const kidsCornerFees = [
  ["Before school care", "$800 per school year", "$1,300", "$1,500"],
  ["After school care", "$2,200 per school year ($183 monthly)", "$3,700 ($308 monthly)", "$5,200 ($330 monthly)"],
  ["Drop-in A.M.", "$6 per day per child", "-", "-"],
  ["Drop-in P.M.", "$15 per day", "$25", "$35"],
];

export const handbookUpdatedInformation = [
  ["Page 15", "Food Allergies, Intolerances, and Nut Restrictions"],
  ["Page 15", "EpiPen Policy for Students with Severe Allergies"],
  ["Page 19", "FACTS SIS"],
  ["Page 20", "Purchasing Lunches"],
  ["Page 24", "Physical Conduct and Discriminatory Behavior Policy"],
  ["Page 32", "St. Martha School Cellphone, Chromebook, and Technology Acceptable Use Policy (separate policy sent home)"],
];
