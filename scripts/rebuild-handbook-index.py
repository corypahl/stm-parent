#!/usr/bin/env python3
"""Rebuild the website's searchable handbook index from the school PDF.

Usage:
  python scripts/rebuild-handbook-index.py path/to/handbook.pdf

The extractor uses the PDF's embedded text. Multi-column and table-heavy pages are
normalized below so their reading order stays sensible on the website.
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

import pdfplumber
from pypdf import PdfReader


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "app" / "data" / "handbook.json"


def normalize_lines(text: str, skip: set[str] | None = None) -> str:
    skipped = {item.casefold() for item in (skip or set())}
    lines: list[str] = []
    blank = True
    for raw in text.replace("\u00ad", "").splitlines():
        line = re.sub(r"\s+", " ", raw.strip())
        if not line or re.fullmatch(r"\d+", line):
            if not blank and lines:
                lines.append("")
            blank = True
            continue
        if line.casefold() in skipped:
            continue
        lines.append(line)
        blank = False
    while lines and not lines[-1]:
        lines.pop()
    return "\n".join(lines)


def add_heading_breaks(text: str, headings: list[str]) -> str:
    heading_set = {heading.casefold() for heading in headings}
    paragraphs = text.split("\n\n")
    merged: list[str] = []
    for current in paragraphs:
        previous = merged[-1] if merged else ""
        previous_line = previous.splitlines()[-1].strip() if previous else ""
        current_line = current.splitlines()[0].strip() if current else ""
        should_merge = (
            previous
            and current
            and previous_line.casefold() not in heading_set
            and current_line.casefold() not in heading_set
            and not re.match(r"^[•*]", current_line)
            and not re.search(r"[.!?:;,\"”')\]]$", previous_line)
        )
        if should_merge:
            merged[-1] = f"{previous}\n{current}"
        else:
            merged.append(current)

    lines = "\n\n".join(merged).splitlines()
    result: list[str] = []
    for line in lines:
        if line.casefold() in heading_set:
            if result and result[-1]:
                result.append("")
            result.append(line)
            result.append("")
        else:
            result.append(line)
    return re.sub(r"\n{3,}", "\n\n", "\n".join(result)).strip()


def section(section_id: str, title: str, content: str, headings: list[str], start: int, end: int | None = None) -> dict:
    return {
        "id": section_id,
        "title": title,
        "content": add_heading_breaks(content.strip(), headings),
        "subheadings": headings,
        "pageStart": start,
        "pageEnd": end or start,
    }


def main() -> None:
    if len(sys.argv) != 2:
        raise SystemExit("Pass the source handbook PDF path.")

    source = Path(sys.argv[1]).resolve()
    if not source.is_file():
        raise SystemExit(f"Handbook not found: {source}")

    reader = PdfReader(str(source))
    if len(reader.pages) != 40:
        raise SystemExit(f"Expected the 2026-27 40-page handbook; found {len(reader.pages)} pages.")

    with pdfplumber.open(source) as pdf:
        def layout(page: int, *skip: str) -> str:
            raw = pdf.pages[page - 1].extract_text(x_tolerance=2, y_tolerance=3, layout=True) or ""
            return normalize_lines(raw, set(skip))

        def compact(page: int, *skip: str) -> str:
            raw = reader.pages[page - 1].extract_text() or ""
            return normalize_lines(raw, set(skip))

        page20 = layout(20, "School Policies")
        policies20, liturgy20 = page20.split("Weekly School Liturgy", 1)
        page32 = layout(32, "Emergency Procedures and Safety Guidelines (cont’d)")
        safety32, lunch32 = page32.split("Lunch Program", 1)

        mission_hours = """School Mission Statement
In a loving, nurturing environment, rooted in Jesus Christ, St. Martha Catholic School guides each student to develop their unique gifts and potential through prayer, study and service.

Our Philosophy
We believe the family, as the primary educator, partners with us in the responsibility of preparing students for lifelong journey of faith and learning.
We believe that knowledge of our Catholic beliefs, practices and traditions is critical to students to enable them to develop the moral strength to follow Christ in today’s world.
We believe that Catholic education requires active stewardship rooted in social justice and civic responsibility.
We believe a challenging school wide curriculum rooted in gospel values provides students with optimal opportunities to succeed.
We believe teachers engage in meaningful researched based professional development to improve skills for effective instruction.
We believe students learn best when actively engaged and motivated to become lifelong learners.
We believe in providing differentiated instruction so all students will achieve to their highest potential.

School Hours
Full School Day: 8:00 a.m.-3:25 p.m.
Half School Day: 8:00 a.m.-11:25 a.m.
Preschool & Kindergarten Full Day: 8:00 a.m.-3:20 p.m.
Preschool & Kindergarten Half Day: 8:00 a.m.-11:20 a.m.
Lunch & Recess: 11:30 a.m.-12:20 p.m.
School Office Hours (Monday-Friday): 7:45 a.m.-3:45 p.m.
Before School Care: 7:20 a.m.-7:50 a.m.
After School Care (Kids Corner): 3:25 p.m.-6:00 p.m."""

        enrollment = """St. Martha School admits students during three consecutive periods to be announced annually in the following order:

January 11, 2027-February 5, 2027
Re-enrollment for current St. Martha School and Preschool students/siblings in good standing under the Tuition Policy.

February 8, 2027-February 19, 2027
For children of the parish.

Beginning on February 22, 2027
For the community at large. If needed, an enrollment waiting list and status will be announced at the conclusion of the period.

Diocesan Policy on the Human Body
Diocesan schools partner with families to educate and form students consistent with the teachings of our Lord, Jesus Christ and His Church, and so families are expected to live in accord with the Gospel values, particularly regarding actions and behaviors that are public. Students and parents (or legal guardians) shall conduct themselves in accord with their God-Given biological sex. Anything to the contrary notwithstanding.

Admissions
Saint Martha School welcomes students of any race, religion, sex, color, national and ethnic origin, to all rights, privileges, programs, and activities generally accorded students at school or made available to students in this school. Every reasonable effort will be made by the St. Martha School staff to meet the academic needs of each student and to help children modify inappropriate student behavior.

St. Martha reserves the right not to enroll, or to request that parents withdraw any student whose academic or behavioral needs cannot be met given the staff, materials, and facilities at St. Martha School.

Withdrawal Policy
• Registration and book fees are nonrefundable.
• Fees for extra-curricular classes (i.e. strings) are nonrefundable.
• Tuition will be refunded according to the following schedule:
• 100% of tuition will be refunded for withdrawals during the 1st through the 5th full day of class.
• 50% of tuition will be refunded for withdrawals during the 6th through 10th full day of class.
• No tuition will be refunded for withdrawals after the 10th full day of class."""

        communication = """FACTS Family Portal
The FACTS Family Portal is St. Martha School’s primary communication and information system for families. Once registered, families will receive an email with login credentials and instructions for access. Families are encouraged to securely save their username and password for ongoing use.

The portal is used to view grades and general school information, access report cards, manage tuition and other payments (including lunch and incidental charges), complete re-enrollment, add and track volunteer hours, and manage school lunch accounts.

News Notes
The weekly newsletter is emailed to parents every Tuesday and serves as an important source of school communication. Unless there is an unforeseen circumstance, Tuesday News Notes will be sent consistently each week. Families are encouraged to read it regularly to stay informed about school events, updates, and important information.

Email
Teachers and staff will make every effort to respond to parent emails within 24 hours during the school week. This expectation does not include weekends, holidays, or school breaks. Emails received on Fridays or before a holiday will be responded to on the next school day.

Cell Phone & Texting
In keeping with the “family atmosphere” of St. Martha School, some teachers and staff may choose to share their personal cell phone numbers, though this is not required. Families are asked to use discretion when contacting staff in this way, as teachers are actively engaged with students during the school day. For all school-related messages or time-sensitive communication, parents are encouraged to contact the school office directly, as staff may not be able to check email or messages until the end of the school day.

ClassDojo (PreK-4)
ClassDojo is a communication tool used to keep families connected to what is happening in the classroom through updates, messages, and occasional photos or reminders. Each teacher may use it a little differently depending on the needs of their classroom. Parents are encouraged to view themselves as partners in their child’s learning and to check ClassDojo regularly to stay informed and support classroom expectations at home.

Requested Teacher & Principal Meetings
To ensure staff availability and minimize disruptions to the school day, parents are asked not to drop in for meetings. Parents who wish to meet with the principal or any staff member should call or email the school to schedule an appointment in advance."""

        major_behavior = """St. Martha School is committed to providing a safe, respectful, and Christ-centered learning environment where every student is treated with dignity. Behaviors that compromise the safety, well-being, or dignity of others including physical aggression, unsafe physical contact, and discriminatory or offensive language are inconsistent with our Catholic values and will be addressed promptly.

Whenever appropriate, restorative practices and logical consequences will be used to promote reflection, accountability, and the repair of relationships. The principal reserves the right to determine appropriate disciplinary action based on the severity of the behavior, the student's age and developmental level, prior behavior, intent, and the safety of the school community.

The following behaviors significantly impact the safety, dignity, or well-being of others and require administrative involvement.

Examples include, but are not limited to:
• Severe physical aggression (hitting, punching, kicking, fighting, or intentional physical harm)
• Rough play or unsafe physical contact (play fighting, wrestling, pushing, body checking, or other unsafe physical interactions)
• Discriminatory, offensive, or abusive language, including racial or ethnic slurs, derogatory remarks, swearing directed at others, or language that demeans another person's identity or dignity.

Major Behavior Response Rubric
1st Occurrence
Teacher implements an appropriate logical consequence, reteaches expectations, documents the behavior, and communicates with parents. Administration may be involved depending on the severity of the incident.

Repeated Behavior
Principal discipline notice, parent contact, restorative conference, and appropriate school consequences, which may include loss of privileges, behavior plan, detention, or suspension.

Continued or Severe Behavior
Administrative intervention with parent conference. Consequences may include in-school suspension, out-of-school suspension, behavior contract, or other disciplinary action deemed appropriate by the principal. Law enforcement may be contacted when required by law or when safety is compromised.

Please Note: The principal reserves the right to bypass progressive discipline when a student's behavior poses a significant safety risk, involves serious aggression, threats, harassment, discriminatory conduct, or any action that substantially disrupts the learning environment. Consequences will be determined based on the severity of the incident, the student's age and developmental level, intent, prior behavior, and the safety of the school community."""

        acknowledgment = """Commitment to a Safe and Respectful School Community
St. Martha School is committed to fostering a safe, respectful, and supportive learning environment for all students. A student's behavior, whether it occurs on or off the school campus, may impact the safety and well-being of the individual student, other students, or the broader school community. Such behavior may also indicate concerns that require the school's attention and support.

As a Catholic learning community, St. Martha School partners with parents, students, administration, faculty, and staff to help young people grow into responsible, moral, and faith-filled individuals. In support of this shared mission, and notwithstanding any other provision of this handbook, parents and legal guardians acknowledge that the school's Code of Conduct and disciplinary policies may be applied to student behavior occurring both on and off school property when such behavior affects the safety, reputation, or well-being of the school community.

Family Name:
Name & Grade of Student(s):

Updated Information for 26-27
p. 8 FACTS Enrollment Fee due July 1st
p. 13 Smart Watches
p. 16 Late Arrivals on Thursdays
p. 18 5-8 Missing & Late Work Policy
p. 18 Spring Conferences
p. 20 Logging Volunteer Hours in FACTS
p. 21 Family Involvement Structure
p. 26 Kids Corner Pricing
p. 29 Bullying vs. Conflict
p. 32 Monthly Lunch Selection Info
p. 37 Major Behavior Response Rubric

Parents/Guardians: Please initial below:
I have read and discussed the policies outlined in the St. Martha Parent & Student Handbook with my child(ren). I understand that failure to follow the guidelines, expectations, and procedures described may result in disciplinary action. I agree to support the school in reinforcing these rules and expectations with my child(ren) and will partner with the school to promote a positive and respectful learning environment.

For Students in Grades 4-8 ONLY:
I have read and understand the contents of the 2026-2027 St. Martha School Parent & Student Handbook. I will respect and follow these rules while I am a student at St. Martha School. Please sign and date below."""

        sections = [
            section("welcome-letter", "Welcome from the principal", layout(3, "Welcome to St. Martha Catholic School"), [], 3),
            section("mission-philosophy-hours", "Mission, philosophy & school hours", mission_hours, ["School Mission Statement", "Our Philosophy", "School Hours"], 4),
            section("staff-roster", "Staff roster 2026-2027", "\n\n".join([compact(5, "Staff Roster 2026-2027", "Teacher Role Email"), compact(6, "Staff Roster 2026-2027 (cont’d)", "Teacher Role Email")]), [], 5, 6),
            section("enrollment-admissions-withdrawal", "Enrollment, admissions & withdrawal", enrollment, ["Diocesan Policy on the Human Body", "Admissions", "Withdrawal Policy"], 7),
            section("tuition-policy", "Tuition policy", layout(8, "Tuition Policy"), ["Tuition and Fee Payments", "RaiseRight Program (Tuition Credit)"], 8),
            section("attendance", "Attendance & reporting an absence", layout(9, "Attendance"), ["Reporting an Absence or Early Dismissal"], 9),
            section("tardiness", "Tardiness", layout(10, "Tardiness"), ["If in a school year, you are late everyday by...."], 10),
            section("uniforms", "Uniform, dress code & spirit wear", "\n\n".join([layout(11, "Uniform, Dress Code & Spirit Wear Policy"), layout(12, "Uniform, Dress Code & Spirit Wear Policy"), layout(13, "Uniform, Dress Code & Spirit Wear Policy"), "Uniform Guidelines K-8", compact(14, "Uniform, Dress Code & Spirit Wear Policy", "Examples:", "View more options", "in the Uniform Booklet."), compact(15, "Uniform, Dress Code & Spirit Wear Policy", "Examples:", "View more options", "in the Uniform Booklet.")]), ["School Uniforms", "Cold Weather", "Non-Uniform (Free Dress) Days", "Acceptable Attire", "The Following Are Not Permitted", "Birthday Free Dress", "St. Martha Spirit Wear Days", "Students may wear:", "Spirit Wear may be worn with:", "General Appearance Guidelines", "Nails and Makeup", "Accessories", "Uniform Policy Enforcement", "Warm Weather Uniform", "General Uniform Expectations", "Uniform Guidelines K-8"], 11, 15),
            section("arrival", "Arrival procedures", layout(16, "Arrival Procedures"), ["Morning Arrival", "Preschool Option 1: Park and Walk (Preferred)", "Preschool Option 2: Carline (See Kindergarten-8th Grade)", "Late Arrival", "Building Access Before School"], 16),
            section("dismissal", "Dismissal procedures", layout(17, "Dismissal Procedures"), ["Preschool Half-Day Dismissal", "Preschool Full-Day Dismissal", "Kindergarten-8th Grade Dismissal", "Dismissal Safety Procedures"], 17),
            section("academic-policies", "Academic policies", layout(18, "Academic Policies"), ["Homework", "Make-Up Work", "Middle School (5th-8th) Late & Missing Work Policy", "Parent/Teacher Conferences", "Report Cards", "NWEA Assessments"], 18),
            section("school-policies", "School policies", "\n\n".join([layout(19, "School Policies"), policies20]), ["Birthdays & Celebrations", "Party Invitations", "Bullying Access", "Recess", "Sports & Athletics", "Visitors", "Volunteers", "Weapon Policy: Public Act 250 of 1995"], 19, 20),
            section("weekly-liturgy", "Weekly school liturgy", liturgy20, [], 20),
            section("family-involvement", "Family involvement & volunteering", "\n\n".join([layout(21, "Family Involvement & Volunteering"), layout(22, "Family Involvement Structure"), layout(23, "Family Involvement Structure (cont’d)")]), ["Guiding Principles", "School Liaison", "Responsibilities", "Classroom Liaisons (Preschool-8th Grade)", "Event Coordinators", "Volunteer Community"], 21, 23),
            section("field-trips", "Field trips & class trips", layout(24, "Field Trips & Class Trips"), [], 24),
            section("kids-corner", "Kids Corner (morning & after care)", "\n\n".join([compact(25, "Kids Corner (Morning & After Care)"), compact(26, "Kids Corner (Before & After Care)")]), ["Program Objective", "Hours of Operation", "Sign-In and Sign-Out Procedures", "Late Pick-Up Policy", "Before School Care and Arrival Procedures", "Fee Schedule", "Billing for Kids Corner"], 25, 26),
            section("health-wellness", "Health & wellness", "\n\n".join([layout(27, "Health & Wellness"), layout(28, "Health & Wellness (cont’d)")]), ["Food Allergies, Intolerances & Nut Restrictions", "EpiPen Policy for Students with Severe Allergies", "Injuries at School", "Illness", "Immunizations", "Medication", "Supporting Student Mental Health and Safety", "Counseling/Mental Health Resources", "Pesticides"], 27, 28),
            section("bullying", "Bullying information", layout(29, "Bullying Info"), ["Bullying is defined as repeated, intentional behavior that causes physical, emotional, social, or psychological harm and involves an imbalance of power.", "Bullying vs. Conflict", "Examples of Prohibited Behavior", "Reporting and Investigation", "Our Commitment"], 29),
            section("sexual-harassment", "Sexual harassment", layout(30, "Sexual Harassment"), ["Sexual Harassment may include, but is not limited to:", "Nonverbal Harassment", "Physical Harassment", "Verbal Harassment", "Consequences", "Child Protection Law"], 30),
            section("emergency-safety", "Emergency procedures & safety guidelines", "\n\n".join([layout(31, "Emergency Procedures and Safety Guidelines"), safety32]), ["Fire and Tornado Drills", "Lockdown Drills", "School Closing", "Hazardous Travel Conditions", "School Crisis Plan", "Asbestos Hazard Emergency Response Act (AHERA)", "Child Protection Law"], 31, 32),
            section("lunch-program", "Lunch program", lunch32, ["Lunches from Home", "Microwaves"], 32),
            section("student-concerns", "Student academic & behavior concerns", layout(33, "Student Academic and Behavior Concerns"), [], 33),
            section("discipline-philosophy", "Discipline philosophy & Education in Virtue", layout(34, "Discipline Philosophy & Education in Virtue"), ["Logical consequences are:", "Education in Virtue"], 34),
            section("behavior-expectations", "Student behavior expectations", "\n\n".join([layout(35, "Student Behavior Expectations"), layout(36, "Student Behavior Expectations")]), ["General Rules", "Lunchroom Expectations", "Restorative Justice", "Consequences"], 35, 36),
            section("major-behavior-rubric", "Major behavior response rubric", major_behavior, ["Examples include, but are not limited to:", "Major Behavior Response Rubric", "1st Occurrence", "Repeated Behavior", "Continued or Severe Behavior"], 37),
            section("communication-channels", "Communication channels", communication, ["FACTS Family Portal", "News Notes", "Email", "Cell Phone & Texting", "ClassDojo (PreK-4)", "Requested Teacher & Principal Meetings"], 38),
            section("copyright-technology", "Copyright & technology acceptable use", layout(39, "St. Martha School U.S. Copyright Information"), ["St. Martha School: Acceptable Use Policy for Cell Phones, Chromebooks, and Technology"], 39),
            section("acknowledgment", "Parent & student handbook acknowledgment", acknowledgment, ["Commitment to a Safe and Respectful School Community", "Updated Information for 26-27", "Parents/Guardians: Please initial below:", "For Students in Grades 4-8 ONLY:"], 40),
        ]

    OUTPUT.write_text(json.dumps(sections, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {len(sections)} sections to {OUTPUT}")


if __name__ == "__main__":
    main()
