import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const OFFICIAL_STAFF_URL = "https://st-martha.org/staff-school";
const OUTPUT_PATH = fileURLToPath(new URL("../app/data/staff.json", import.meta.url));
const USER_AGENT = "Mozilla/5.0 (compatible; StMarthaParentDirectoryBot/1.0; +https://corypahl.github.io/stm-parent/)";

export function parseStaffDirectoryHtml(html) {
  if (/cf_chl_opt|enable javascript and cookies to continue|just a moment/i.test(html)) {
    throw new Error("The official staff page returned a Cloudflare challenge instead of the directory.");
  }

  const members = [];
  let currentGroup = "Leadership & office";
  const itemPattern = /<li\b[^>]*class=(['"])([^'"]*)\1[^>]*>([\s\S]*?)<\/li>/gi;

  for (const match of html.matchAll(itemPattern)) {
    const classes = match[2].split(/\s+/);
    const fragment = match[3];

    if (classes.includes("personGroup")) {
      currentGroup = staffGroup_(classText_(fragment, "name"));
      continue;
    }
    if (!classes.includes("person")) continue;

    const name = classText_(fragment, "name");
    const role = classText_(fragment, "role");
    if (!name || !role) continue;

    const localMail = classText_(fragment, "localMail");
    const domainMail = classText_(fragment, "domainMail");
    const phone = decodeHtml_(fragment.match(/href=(['"])tel:([^'"]+)\1/i)?.[2] || "");
    const member = {
      id: staffId_(name),
      name,
      group: currentGroup,
      roles: role.split(/\s*;\s*/).map(cleanText_).filter(Boolean),
    };
    const email = localMail && domainMail ? `${localMail}@${domainMail}`.toLowerCase() : "";
    // The official page currently contains one malformed domain. Omit an
    // invalid address instead of guessing at a correction or publishing it.
    if (/^[^\s@]+@st-martha\.org$/i.test(email)) member.email = email;
    if (phone) member.phone = cleanText_(phone);
    members.push(member);
  }

  return members;
}

export function validateStaffRoster(members) {
  if (!Array.isArray(members) || members.length < 10 || members.length > 100) {
    throw new Error(`Expected 10-100 staff members, received ${members?.length ?? 0}.`);
  }

  const requiredGroups = ["Leadership & office", "Homeroom teachers", "Specials", "Support staff"];
  for (const group of requiredGroups) {
    if (!members.some((member) => member.group === group)) throw new Error(`The official directory is missing the ${group} section.`);
  }

  const ids = new Set();
  for (const member of members) {
    if (!member.id || !member.name || !member.roles?.length) throw new Error("A staff entry is missing its name or role.");
    if (ids.has(member.id)) throw new Error(`Duplicate staff ID: ${member.id}.`);
    ids.add(member.id);
    if (member.email && !/^[^\s@]+@st-martha\.org$/i.test(member.email)) {
      throw new Error(`Unexpected email address for ${member.name}: ${member.email}.`);
    }
  }
  return members;
}

export async function syncSchoolStaff({ fetchImpl = fetch, outputPath = OUTPUT_PATH } = {}) {
  const response = await fetchImpl(OFFICIAL_STAFF_URL, {
    headers: {
      accept: "text/html,application/xhtml+xml",
      "cache-control": "no-cache",
      "user-agent": USER_AGENT,
    },
    redirect: "follow",
  });
  if (!response.ok) throw new Error(`Official staff directory returned HTTP ${response.status}.`);

  const members = validateStaffRoster(parseStaffDirectoryHtml(await response.text()));
  const next = serializeStaffRoster_(members);
  const current = await readFile(outputPath, "utf8").catch((error) => {
    if (error?.code === "ENOENT") return "";
    throw error;
  });

  if (current === next) {
    console.log(`Official staff directory is unchanged (${members.length} staff members).`);
    return { changed: false, members };
  }

  await writeFile(outputPath, next, "utf8");
  console.log(`Updated ${outputPath} with ${members.length} staff members from ${OFFICIAL_STAFF_URL}.`);
  return { changed: true, members };
}

function staffGroup_(value) {
  const normalized = cleanText_(value).toLowerCase();
  if (/main office|contact us|leadership|administration|pastor/.test(normalized)) return "Leadership & office";
  if (/homeroom/.test(normalized)) return "Homeroom teachers";
  if (/special/.test(normalized)) return "Specials";
  if (/support/.test(normalized)) return "Support staff";
  throw new Error(`Unrecognized staff group on the official directory: ${value || "(blank)"}.`);
}

function classText_(html, className) {
  const pattern = new RegExp(`<(?:div|span)\\b[^>]*class=(['"])[^'"]*\\b${className}\\b[^'"]*\\1[^>]*>([\\s\\S]*?)<\\/(?:div|span)>`, "i");
  return cleanText_(html.match(pattern)?.[2] || "");
}

function cleanText_(value) {
  return decodeHtml_(String(value || "").replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}

function decodeHtml_(value) {
  const named = { amp: "&", apos: "'", gt: ">", lt: "<", nbsp: " ", quot: '"' };
  return String(value || "")
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number.parseInt(code, 10)))
    .replace(/&([a-z]+);/gi, (entity, name) => named[name.toLowerCase()] ?? entity);
}

function staffId_(name) {
  return name
    .replace(/^(?:father|fr\.?|mrs\.?|mr\.?|ms\.?|dr\.?)\s+/i, "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function serializeStaffRoster_(members) {
  return `[\n${members.map((member) => `  ${JSON.stringify(member)}`).join(",\n")}\n]\n`;
}

const isDirectRun = process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url;
if (isDirectRun) await syncSchoolStaff();
