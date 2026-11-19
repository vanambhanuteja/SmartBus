// Builds SmartBus_CDD_Presentation.pptx  (run: node build_deck.js)
const pptxgen = require("pptxgenjs");
const { applyTheme } = require("/mnt/skills/public/pptx/scripts/apply_theme.js");

const THEME = {
  name: "SmartBus", headFontFace: "Calibri", bodyFontFace: "Calibri",
  colors: { dk1: "1C2430", lt1: "FFFFFF", dk2: "0B5CAD", lt2: "EEF3F9", accent1: "0B5CAD", accent2: "1B7F3B",
            accent3: "8A6D00", accent4: "C2570C", accent5: "B3261E", accent6: "55606E", hlink: "0B5CAD", folHlink: "55606E" },
};
const pres = new pptxgen();
pres.layout = "LAYOUT_16x9";
pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
pres.title = "SmartBus - CDD Project Presentation";
const C = pres.SchemeColor;

pres.defineSlideMaster({
  title: "TITLE_SLIDE", background: { color: C.accent1 },
  objects: [],
  slideNumber: undefined,
});
pres.defineSlideMaster({
  title: "CONTENT", background: { color: C.background1 },
  objects: [
    { rect: { x: 0, y: 0, w: 0.18, h: 5.625, fill: { color: C.accent1 } } },
    { text: { text: "SmartBus · CDD 1BCS303 · NIE Mysuru", options: { x: 0.5, y: 5.25, w: 6, h: 0.3, fontSize: 10, color: C.accent6, margin: 0 } } },
  ],
  slideNumber: { x: 9.1, y: 5.25, w: 0.5, h: 0.3, fontSize: 10, color: C.accent6 },
});

function content(title, buildBody, notes) {
  const s = pres.addSlide({ masterName: "CONTENT" });
  s.addText(title, { x: 0.5, y: 0.3, w: 9, h: 0.8, fontSize: 28, bold: true, color: C.accent1, margin: 0, valign: "middle", isTextBox: true });
  buildBody(s);
  if (notes) s.addNotes(notes);
  return s;
}
function bullets(s, items, opt = {}) {
  s.addText(items.map((t, i) => ({ text: t, options: { bullet: true, breakLine: i < items.length - 1, paraSpaceAfter: 8 } })),
    { x: 0.5, y: 1.3, w: opt.w || 9, h: opt.h || 3.7, fontSize: opt.fontSize || 18, color: C.text1, valign: "top", isTextBox: true });
}
function card(s, x, y, w, h, head, body, color) {
  s.addShape(pres.shapes.RECTANGLE, { x, y, w, h, fill: { color: C.background2 }, line: { color: C.background2 } });
  s.addShape(pres.shapes.RECTANGLE, { x, y, w, h: 0.07, fill: { color }, line: { color } });
  s.addText(head, { x: x + 0.15, y: y + 0.15, w: w - 0.3, h: 0.35, fontSize: 18, bold: true, color, margin: 0, isTextBox: true });
  s.addText(body, { x: x + 0.15, y: y + 0.55, w: w - 0.3, h: h - 0.65, fontSize: 15, color: C.text1, margin: 0, valign: "top", paraSpaceAfter: 6, isTextBox: true });
}

// 1 Title
{ const s = pres.addSlide({ masterName: "TITLE_SLIDE" });
  s.addText("SmartBus", { x: 0.7, y: 1.2, w: 8.6, h: 0.9, fontSize: 48, bold: true, color: C.background1, margin: 0, isTextBox: true });
  s.addText("Public Transport Crowd Monitoring and Prediction Platform", { x: 0.7, y: 2.1, w: 8.6, h: 0.6, fontSize: 22, color: C.background1, margin: 0, isTextBox: true });
  s.addText("Collaborative Development and DevOps (1BCS303) · Academic Year 2026–27\nDepartment of Computer Science and Engineering, The National Institute of Engineering, Mysuru\nTeam of 5 members: [add names and USNs]",
    { x: 0.7, y: 3.3, w: 8.6, h: 1.3, fontSize: 14, color: C.background2, margin: 0, valign: "top", isTextBox: true });
  s.addNotes("Introduce the project and team. Replace the placeholder line with real names and USNs before presenting."); }

content("Introduction and problem statement", (s) => bullets(s, [
  "Mysuru bus passengers cannot tell how crowded a bus will be before boarding",
  "Result: uncomfortable journeys, overcrowding, poor travel planning",
  "Little occupancy information is published for routes and timings",
  "SmartBus = routes + map + crowd forecast + passenger crowd reports + admin analytics",
]));

content("Objectives", (s) => bullets(s, [
  "Passenger web app: routes, stops, interactive map, crowd forecast, crowd reporting",
  "Admin dashboard with analytics and route / stop / report management",
  "Simple ML model for occupancy prediction (Random Forest)",
  "Collaborative development: Git, GitHub, Gitflow, pull requests",
  "Docker + Docker Compose, CI/CD with GitHub Actions",
  "Infrastructure as Code (Terraform) and Azure container deployment; UX design in Figma",
], { fontSize: 17 }));

content("Existing system", (s) => bullets(s, [
  "Passengers judge crowding only by looking at the stop or asking others",
  "Timetables and route information do not show occupancy",
  "No way to compare crowd levels at different travel times",
  "Operators lack an easy aggregated view of reported crowding",
]), "This describes typical city-bus information gaps in general; it is not a study of KSRTC internal systems.");

content("Proposed system and features", (s) => {
  card(s, 0.5, 1.3, 2.9, 3.6, "Passenger", "Register / login\nRoutes, stops, Leaflet map\nChoose route + time + day\nLow / Moderate / High / Overcrowded forecast\nReport current crowd\nSee previous reports", C.accent1);
  card(s, 3.55, 1.3, 2.9, 3.6, "Administrator", "Role-based login\nTotals: routes, buses, reports\nCrowd distribution chart\nHourly historical analytics\nManage routes, stops, reports\nView predictions", C.accent2);
  card(s, 6.6, 1.3, 2.9, 3.6, "Prediction service", "Python + scikit-learn\nInputs: route, time, weekday, history, recent reports\nOutput: occupancy %, category, timestamp\nBackend calls it over REST", C.accent4);
});

content("System architecture", (s) => {
  const box = (x, y, w, label, sub, color) => {
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h: 1.0, fill: { color }, line: { color }, rectRadius: 0.08 });
    s.addText([{ text: label, options: { bold: true, fontSize: 15, breakLine: true } }, { text: sub, options: { fontSize: 11 } }],
      { x, y, w, h: 1.0, align: "center", valign: "middle", color: C.background1, margin: 0.05, isTextBox: true });
  };
  box(0.5, 1.5, 2.2, "React frontend", "nginx · Leaflet · OSM", C.accent1);
  box(3.9, 1.5, 2.2, "Spring Boot", "REST API · JWT · RBAC", C.accent1);
  box(7.3, 1.5, 2.2, "PostgreSQL", "8 tables · volume", C.accent2);
  box(3.9, 3.4, 2.2, "Python ML service", "Flask · Random Forest", C.accent4);
  s.addShape(pres.shapes.LINE, { x: 2.7, y: 2.0, w: 1.2, h: 0, line: { color: C.text1, width: 2, endArrowType: "triangle" } });
  s.addShape(pres.shapes.LINE, { x: 6.1, y: 2.0, w: 1.2, h: 0, line: { color: C.text1, width: 2, endArrowType: "triangle" } });
  s.addShape(pres.shapes.LINE, { x: 5.0, y: 2.5, w: 0, h: 0.9, line: { color: C.text1, width: 2, endArrowType: "triangle" } });
  s.addText("All four run as containers on one Docker Compose network; only the frontend port is published.", { x: 0.5, y: 4.6, w: 9, h: 0.4, fontSize: 13, color: C.accent6, isTextBox: true, margin: 0 });
});

content("Technology stack", (s) => {
  const rows = [["Layer", "Technologies (versions in docs)"],
    ["Frontend", "React 18, Vite, Leaflet + OpenStreetMap, HTML5/CSS3/JavaScript"],
    ["Backend", "Java 21, Spring Boot 3.3, Spring Security + JWT, JPA"],
    ["Database", "PostgreSQL 16"],
    ["ML", "Python 3.12, Pandas, NumPy, scikit-learn, Flask"],
    ["DevOps", "Git/GitHub, GitHub Actions, Docker, Compose, Terraform, Azure ACR + ACI"],
    ["Testing", "JUnit + MockMvc, pytest, Vitest, Postman"]];
  s.addTable(rows.map((r, i) => r.map((c) => ({ text: c, options: { bold: i === 0, color: i === 0 ? C.background1 : C.text1, fill: { color: i === 0 ? C.accent1 : (i % 2 ? C.background1 : C.background2) }, fontSize: 14 } }))),
    { x: 0.5, y: 1.3, w: 9, colW: [1.6, 7.4], rowH: 0.5, border: { type: "solid", color: C.background2, pt: 1 }, valign: "middle" });
});

content("Database design", (s) => {
  bullets(s, [
    "8 tables: Users, Buses, Routes, Bus_Stops, Route_Stops, Trips, Crowd_Reports, Predictions",
    "Routes ↔ Stops many-to-many via Route_Stops (ordered); many buses per route via Trips",
    "Many reports per trip; each report is PASSENGER or SYNTHETIC so real data can replace simulated data",
    "Primary / foreign keys, CHECK constraints, indexes; BCrypt password hashes",
    "Verified: schema + seed loaded into PostgreSQL 16 (12 routes, 30 stops, 24 buses)",
  ], { w: 9, fontSize: 17 });
});

content("Machine learning", (s) => {
  s.addText([
    { text: "Random Forest regressor → occupancy %, then Low / Moderate / High / Overcrowded", options: { bullet: true, breakLine: true, paraSpaceAfter: 8 } },
    { text: "Features: route, hour, weekday, historical occupancy, recent passenger reports", options: { bullet: true, breakLine: true, paraSpaceAfter: 8 } },
    { text: "Data is SYNTHETIC (simulated) – not real KSRTC measurements", options: { bullet: true, bold: true, breakLine: true, paraSpaceAfter: 8 } },
    { text: "Temporal split: last 2 weeks held out for testing", options: { bullet: true } },
  ], { x: 0.5, y: 1.3, w: 5.3, h: 3.5, fontSize: 16, color: C.text1, valign: "top", isTextBox: true });
  const m = [["Metric (test set)", "Value"], ["MAE", "5.15 pts"], ["R²", "0.90"], ["Category accuracy", "0.80"], ["Precision / Recall / F1 (weighted)", "0.80 / 0.80 / 0.80"]];
  s.addTable(m.map((r, i) => r.map((c) => ({ text: c, options: { bold: i === 0, color: i === 0 ? C.background1 : C.text1, fill: { color: i === 0 ? C.accent1 : C.background2 }, fontSize: 12 } }))),
    { x: 6.0, y: 1.4, w: 3.5, colW: [2.2, 1.3], rowH: 0.45, border: { type: "solid", color: C.background1, pt: 1 }, valign: "middle" });
  s.addText("Scores measure recovery of a simulated pattern, not real-world accuracy.", { x: 6.0, y: 3.8, w: 3.5, h: 0.8, fontSize: 12, italic: true, color: C.accent5, isTextBox: true, margin: 0, valign: "top" });
}, "Be explicit when presenting: the metrics only show the pipeline works. Real accuracy needs real passenger reports.");

content("Git and GitHub collaboration", (s) => bullets(s, [
  "Gitflow: main, develop, feature/frontend, backend, ml, database, devops",
  "Practised: clone, add, commit, push, pull, fetch, merge, rebase",
  "Pull requests with template, 1 review, CI must pass; branch protection script",
  "Issue tracking: 18 starter issues; README + CONTRIBUTING",
  "5 roles: Frontend · Backend · ML + DB · DevOps · UI/UX + integration",
  "Every member commits their own work – no shared credit for work not done",
], { fontSize: 17 }));

content("Docker and CI/CD", (s) => {
  card(s, 0.5, 1.3, 4.35, 3.6, "Docker Compose", "4 containers: frontend, backend, prediction service, PostgreSQL\nEnv vars from .env, private network\nVolume for database persistence\nHealth checks + ordered startup\ndocker compose up --build", C.accent1);
  card(s, 5.15, 1.3, 4.35, 3.6, "GitHub Actions + Terraform", "Detect changes → build & test frontend, backend, Python\nBuild images → compose smoke test\nPush to Docker Hub / ACR only if secrets exist\nManual Azure deploy stage\nTerraform: resource group, ACR, ACI", C.accent2);
}, "Status: written and YAML-valid; the workflows and Docker stack must be run by the team (not executed in the build environment).");

content("UX design with Figma", (s) => bullets(s, [
  "Design Thinking: empathize → define → ideate → prototype → test",
  "Personas (passenger, administrator), user journey, user flows, 6 wireframes",
  "Seven UX factors and five usability characteristics applied; five dimensions of interaction design",
  "Accessibility: text + symbols + colour, 44 px targets, keyboard focus",
  "Figma specification ready (styles, components, frames, prototype wiring)",
  "To do: real user interviews and the Figma file itself",
], { fontSize: 17 }));

content("Results and demonstration", (s) => {
  const rows = [["Component", "Verified result"],
    ["Prediction service", "26 pytest tests passed; HTTP prediction demo worked"],
    ["Frontend", "12 Vitest tests passed; production build succeeded"],
    ["Database", "Schema + seed loaded into PostgreSQL 16; constraints enforced"],
    ["Backend (Spring Boot)", "Written with JUnit tests – to be compiled and run by the team"],
    ["Docker Compose / CI / Azure", "Configured – to be run; no cloud deployment done"]];
  s.addTable(rows.map((r, i) => r.map((c) => ({ text: c, options: { bold: i === 0, color: i === 0 ? C.background1 : C.text1, fill: { color: i === 0 ? C.accent1 : (i % 2 ? C.background1 : C.background2) }, fontSize: 13 } }))),
    { x: 0.5, y: 1.3, w: 9, colW: [2.8, 6.2], rowH: 0.48, border: { type: "solid", color: C.background2, pt: 1 }, valign: "middle" });
  s.addText("Demo flow: register → routes + map → forecast → submit report → admin dashboard. Insert screenshots from a real run here.", { x: 0.5, y: 4.4, w: 9, h: 0.6, fontSize: 13, italic: true, color: C.accent6, isTextBox: true, margin: 0 });
});

content("Conclusion and future scope", (s) => {
  card(s, 0.5, 1.3, 4.35, 3.6, "Conclusion", "SmartBus combines passenger reporting, history and ML into a simple crowd-forecast platform.\nThe project applies all five CDD modules: DevOps/CI/CD/IaC, Git collaboration, containers, UX design and UX factors.\nFindings are honest: data is simulated; remaining steps are listed in the status report.", C.accent1);
  card(s, 5.15, 1.3, 4.35, 3.6, "Future scope", "Verified OSM / KSRTC route data\nReal occupancy data and model retraining\nLive GPS and push alerts\nKannada interface\nManaged cloud database (persistent)\nBrowser end-to-end tests", C.accent2);
});

(async () => {
  await pres.writeFile({ fileName: "SmartBus_CDD_Presentation.pptx" });
  await applyTheme("SmartBus_CDD_Presentation.pptx", THEME);
  console.log("deck written");
})();
