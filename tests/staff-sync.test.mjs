import assert from "node:assert/strict";
import test from "node:test";
import { parseStaffDirectoryHtml, validateStaffRoster } from "../scripts/sync-school-staff.mjs";

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
