import assert from "node:assert/strict";
import test from "node:test";
import { parseStaffDirectoryHtml, parseStaffDirectoryMarkdown, validateStaffRoster } from "../scripts/sync-school-staff.mjs";

const group = (name) => `<li class="personGroup group"><span class="name">${name}</span></li>`;
const person = ({ name, role, phone = "517-349-3322", email }) => `<li class="person group hasThumb">
  <div class="name"><a href="/people/example">${name}</a></div>
  <div class="info"><div class="role">${role}</div></div>
  <div class="phone"><a href="tel:${phone}">${phone}</a></div>
  ${email ? `<a class="mail notranslate"><span class="localMail">${email.split("@")[0]}</span><span class="domainMail">${email.split("@")[1]}</span></a>` : ""}
</li>`;

test("parses official directory groups, roles, phones, and obfuscated email spans", () => {
  const html = [
    person({ name: "Father Ryan Riley", role: "Pastor", phone: "517-349-1763", email: "frryan@st-martha.org" }),
    group("Main Office"),
    person({ name: "Andrea Patton", role: "School Principal", email: "apatton@st-martha.org" }),
    group("Homeroom Teachers"),
    person({ name: "Andreas Quintus", role: "5th Grade Homeroom; 4th-8th Science", email: "aquintus@st-martha.org" }),
    group("Specials"),
    person({ name: "Cecilia Clark", role: "Music &amp; Spanish Teacher", email: "cclark@st-martha.org" }),
    group("Support Staff"),
    person({ name: "Lilia Rampe", role: "Kindergarten Aide", email: "" }),
  ].join("\n");

  assert.deepEqual(parseStaffDirectoryHtml(html), [
    { id: "ryan-riley", name: "Father Ryan Riley", group: "Leadership & office", roles: ["Pastor"], email: "frryan@st-martha.org", phone: "517-349-1763" },
    { id: "andrea-patton", name: "Andrea Patton", group: "Leadership & office", roles: ["School Principal"], email: "apatton@st-martha.org", phone: "517-349-3322" },
    { id: "andreas-quintus", name: "Andreas Quintus", group: "Homeroom teachers", roles: ["5th Grade Homeroom", "4th-8th Science"], email: "aquintus@st-martha.org", phone: "517-349-3322" },
    { id: "cecilia-clark", name: "Cecilia Clark", group: "Specials", roles: ["Music & Spanish Teacher"], email: "cclark@st-martha.org", phone: "517-349-3322" },
    { id: "lilia-rampe", name: "Lilia Rampe", group: "Support staff", roles: ["Kindergarten Aide"], phone: "517-349-3322" },
  ]);
});

test("rejects challenge pages and incomplete rosters instead of overwriting good data", () => {
  assert.throws(() => parseStaffDirectoryHtml("<title>Just a moment...</title><script>window._cf_chl_opt = {};</script>"), /Cloudflare challenge/);
  assert.throws(() => validateStaffRoster([]), /Expected 10-100 staff members/);
});

test("omits malformed official email domains rather than guessing a correction", () => {
  const [member] = parseStaffDirectoryHtml(person({ name: "Carolyn Hall", role: "Math Teacher", email: "chall@at-martha.org" }));
  assert.equal(member.name, "Carolyn Hall");
  assert.equal(member.email, undefined);
});

test("parses the read-only Markdown fallback used when the official host blocks GitHub runners", () => {
  const markdown = `# School Staff
*   ![Image 2: Father Ryan Riley](https://files.ecatholic.com/ryan.jpg)Father Ryan Riley Pastor [517-349-1763](tel:517-349-1763) [frryan st-martha.org](https://st-martha.org/staff-school#)
*   Main Office
*   [![Image 3: Andrea Patton](https://files.ecatholic.com/andrea.jpg)](https://st-martha.org/people/andrea-patton)[Andrea Patton](https://st-martha.org/people/andrea-patton) School Principal [517-349-3322](tel:517-349-3322) [apatton st-martha.org](https://st-martha.org/staff-school#)
*   Homeroom Teachers
*   [![Image 13: Carolyn Hall](https://files.ecatholic.com/carolyn.jpg)](https://st-martha.org/people/carolyn-hall)[Carolyn Hall](https://st-martha.org/people/carolyn-hall) 7th Grade Homeroom; 5th-8th Math Teacher [517-349-3322](tel:517-349-3322) [chall at-martha.org](https://st-martha.org/staff-school#)
*   Specials
*   [![Image 20: Rebeca Ardis](https://files.ecatholic.com/rebecca.jpg)](https://st-martha.org/people/rebecca-ardis)[Rebecca Ardis](https://st-martha.org/people/rebecca-ardis) Strings Teacher [rardis st-martha.org](https://st-martha.org/staff-school#)
*   Support Staff
*   ![Image 23: Lilia Rampe](https://files.ecatholic.com/lilia.jpg)Lilia Rampe Kindergarten Aide
*   [Parish Staff](https://st-martha.org/staff)`;

  assert.deepEqual(parseStaffDirectoryMarkdown(markdown), [
    { id: "ryan-riley", name: "Father Ryan Riley", group: "Leadership & office", roles: ["Pastor"], email: "frryan@st-martha.org", phone: "517-349-1763" },
    { id: "andrea-patton", name: "Andrea Patton", group: "Leadership & office", roles: ["School Principal"], email: "apatton@st-martha.org", phone: "517-349-3322" },
    { id: "carolyn-hall", name: "Carolyn Hall", group: "Homeroom teachers", roles: ["7th Grade Homeroom", "5th-8th Math Teacher"], phone: "517-349-3322" },
    { id: "rebecca-ardis", name: "Rebecca Ardis", group: "Specials", roles: ["Strings Teacher"], email: "rardis@st-martha.org" },
    { id: "lilia-rampe", name: "Lilia Rampe", group: "Support staff", roles: ["Kindergarten Aide"] },
  ]);
});
