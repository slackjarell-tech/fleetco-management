/**
 * FleetCo — Smartphone-first telematics demo deck (50+ slides).
 * Run: npm run marketing:telematics
 * Audit: node scripts/audit-pptx-content.mjs marketing/FleetCo-Smartphone-Telematics-Demo.pptx --min-slides=50
 */
import PptxGenJS from 'pptxgenjs';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { BRAND } from '../marketing/brand.js';
import { FRAMES_DIR, resolveFramePath } from './lib/manualScreenshots.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, '..', 'marketing');
const outFile = path.join(outDir, 'FleetCo-Smartphone-Telematics-Demo.pptx');
const publicDir = path.join(__dirname, '..', 'public', 'marketing');

const NAVY = '0F172A';
const AMBER = 'F59E0B';
const SLATE = '64748B';
const WHITE = 'FFFFFF';
const LIGHT = 'F8FAFC';
const GREEN = '059669';
const RED = 'DC2626';

let slideNum = 0;

function footer(slide) {
  slide.addText(`Smartphone Telematics Demo  ·  ${BRAND.url}  ·  Slide ${slideNum}`, {
    x: 0.4,
    y: 7.08,
    w: 12.5,
    h: 0.32,
    fontSize: 8,
    color: SLATE,
    align: 'center',
  });
}

function section(pptx, label, title, subtitle = null, dark = false) {
  slideNum += 1;
  const slide = pptx.addSlide();
  slide.background = { color: dark ? NAVY : LIGHT };
  slide.addText(label.toUpperCase(), {
    x: 0.55,
    y: 0.38,
    w: 12,
    h: 0.35,
    fontSize: 10,
    bold: true,
    color: AMBER,
    charSpace: 1.5,
  });
  slide.addText(title, {
    x: 0.55,
    y: 0.72,
    w: 12,
    h: 0.75,
    fontSize: 24,
    bold: true,
    color: dark ? WHITE : NAVY,
  });
  if (subtitle) {
    slide.addText(subtitle, {
      x: 0.55,
      y: 1.42,
      w: 12,
      h: 0.55,
      fontSize: 12,
      color: dark ? 'CBD5E1' : SLATE,
    });
  }
  footer(slide);
  return slide;
}

function bullets(slide, items, opts = {}) {
  const { x = 0.55, y = 2.05, w = 12.2, h = 4.85, fontSize = 11, color = NAVY } = opts;
  slide.addText(
    items.map((t) => ({ text: t, options: { bullet: true, breakLine: true } })),
    { x, y, w, h, fontSize, color, valign: 'top', lineSpacingMultiple: 1.08 },
  );
}

function bodyParagraphs(slide, paragraphs, startY = 2.0) {
  let y = startY;
  for (const p of paragraphs) {
    if (p.heading) {
      slide.addText(p.heading, { x: 0.55, y, w: 12, h: 0.32, fontSize: 12, bold: true, color: NAVY });
      y += 0.38;
    }
    bullets(slide, p.items, { y, h: Math.min(2.2, 0.35 * p.items.length + 0.5), fontSize: 10.5 });
    y += 0.35 * p.items.length + 0.55;
  }
}

function twoCol(slide, leftTitle, leftItems, rightTitle, rightItems, startY = 1.95) {
  slide.addText(leftTitle, { x: 0.55, y: startY, w: 6.1, h: 0.32, fontSize: 11, bold: true, color: NAVY });
  bullets(slide, leftItems, { x: 0.55, y: startY + 0.38, w: 6.1, h: 5.0, fontSize: 10.5 });
  slide.addText(rightTitle, { x: 6.85, y: startY, w: 6.1, h: 0.32, fontSize: 11, bold: true, color: NAVY });
  bullets(slide, rightItems, { x: 6.85, y: startY + 0.38, w: 6.1, h: 5.0, fontSize: 10.5 });
}

function tableSlide(pptx, label, title, headers, rows, colW) {
  const slide = section(pptx, label, title);
  const tableRows = [
    headers.map((h) => ({ text: h, options: { bold: true, fill: { color: 'E2E8F0' } } })),
    ...rows.map((row) => row.map((cell) => ({ text: String(cell) }))),
  ];
  slide.addTable(tableRows, {
    x: 0.45,
    y: 2.05,
    w: 12.4,
    colW,
    fontSize: 9,
    border: { type: 'solid', color: 'CBD5E1', pt: 0.5 },
    autoPage: false,
  });
  return slide;
}

function diagramBox(slide, x, y, w, h, title, lines) {
  slide.addShape('rect', {
    x,
    y,
    w,
    h,
    fill: { color: 'E2E8F0' },
    line: { color: SLATE, width: 0.5 },
  });
  slide.addText(title, { x: x + 0.15, y: y + 0.12, w: w - 0.3, h: 0.35, fontSize: 11, bold: true, color: NAVY });
  slide.addText(lines.join('\n'), {
    x: x + 0.15,
    y: y + 0.5,
    w: w - 0.3,
    h: h - 0.6,
    fontSize: 9.5,
    color: NAVY,
    valign: 'top',
    fontFace: 'Consolas',
  });
}

function illustratedSlide(pptx, label, title, bulletItems, imageId, caption, diagramFallback) {
  const slide = section(pptx, label, title);
  const imgPath = resolveFramePath(imageId);
  const textW = imgPath ? 6.0 : 12.2;
  bullets(slide, bulletItems, { x: 0.55, y: 1.95, w: textW, h: 5.1, fontSize: 10.5 });

  if (imgPath) {
    slide.addImage({
      path: imgPath,
      x: 6.65,
      y: 1.85,
      w: 6.25,
      h: 4.75,
      sizing: { type: 'contain', w: 6.25, h: 4.75 },
    });
    slide.addText(caption || `Reference UI: ${imageId}`, {
      x: 6.65,
      y: 6.65,
      w: 6.25,
      h: 0.4,
      fontSize: 8.5,
      italic: true,
      color: SLATE,
    });
  } else {
    diagramBox(slide, 6.65, 1.85, 6.25, 4.75, 'Concept (no screenshot)', diagramFallback);
  }
  return slide;
}

async function main() {
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE';
  pptx.author = BRAND.company;
  pptx.title = 'FleetCo — Smartphone Telematics Demo';
  pptx.subject = 'Dual-camera iPhone/Android review, AI distraction detection, geofencing, optional OBD';

  // —— Cover ——
  slideNum += 1;
  let slide = pptx.addSlide();
  slide.background = { color: NAVY };
  slide.addShape(pptx.shapes.RECTANGLE, { x: 0, y: 0, w: 0.14, h: '100%', fill: { color: AMBER } });
  slide.addText('DETAILED DEMO DECK', { x: 0.7, y: 1.0, w: 11, h: 0.4, fontSize: 12, color: AMBER, charSpace: 2 });
  slide.addText('Smartphone-First Telematics', { x: 0.7, y: 1.55, w: 11.5, h: 1.0, fontSize: 40, bold: true, color: WHITE });
  slide.addText('Dual camera (driver + road) · AI distraction detection · Geofencing · Live dashcam', {
    x: 0.7,
    y: 2.65,
    w: 11,
    h: 0.8,
    fontSize: 16,
    color: 'CBD5E1',
  });
  slide.addText(`${BRAND.shortName}  ·  ${BRAND.url}  ·  ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`, {
    x: 0.7,
    y: 6.2,
    w: 11,
    h: 0.5,
    fontSize: 11,
    color: SLATE,
  });
  footer(slide);

  slide = section(pptx, 'Agenda', 'What you will review in this session (80+ slides)');
  bullets(slide, [
    'Part 1–2 — Context and capability matrix (phone vs hardware telematics)',
    'Part 3 — FleetCo Driver today: GPS, live dashcam, Safety AI backend',
    'Part 3B — Dual-camera review: iPhone & Android front (driver) + rear (road) at the same time',
    'Part 4 — Proposed build: native dual cam, AI on both streams, geofencing, optional OBD',
    'Part 5–6 — Geofencing scenarios and AI distraction detection (detailed event types)',
    'Part 7–12 — Diagnostics, architecture, costs, legal, roadmap, live demo script',
    'Part 14 — Website messaging · Appendix — downloads and code references',
  ], { y: 2.0, fontSize: 11.5 });

  slide = section(pptx, 'Executive summary', 'Recommendation in one slide', null, true);
  bullets(slide, [
    'Dual monitoring goal: rear camera on the road + front (selfie) camera on the driver, recording together while on shift — AI flags distraction (phone, eyes off road, drowsiness, etc.).',
    'Android: many devices support true front+rear concurrent capture via Camera2 (Android 11+); must detect support at runtime — not every model qualifies.',
    'iPhone: simultaneous front+rear is supported natively (AVCaptureMultiCamSession, A12+), but not reliably via browser getUserMedia alone — ship a Capacitor dual-cam native plugin for iOS (and premium Android).',
    'AI: Gemini vision already uses separate road vs cabin prompts in drivingSafetyAi.js — sample frames from BOTH streams during live dashcam; managers review DrivingSafetyEvent queue.',
    'Also in PhonePulse: geofence alerts, background GPS, optional BLE OBD — see later parts of this deck.',
  ], { y: 2.05, fontSize: 10.5, color: 'E2E8F0' });

  // Part 1 — Problem
  slide = section(pptx, 'Part 1 · Context', 'The telematics buyer question');
  bullets(slide, [
    'Fleet managers want real-time visibility, safety scoring, and geofence alerts — often quoted as part of a “full telematics ecosystem.”',
    'Traditional vendors sell a vehicle-mounted device + monthly SaaS per asset ($25–$45/unit/mo is common).',
    'SMB carriers already issue phones and use FleetCo for dispatch, ROs, and driver workflows.',
    'Strategic question: Can we extend the driver app instead of mandating new hardware on every unit?',
  ]);

  slide = section(pptx, 'Part 1 · Context', 'Three capabilities you asked about');
  twoCol(
    slide,
    'Safety & compliance',
    [
      'Real-time AI distraction monitoring (phone, eyes off road, drowsiness)',
      'Live or near-live video to the office',
      'Event log tied to driver, unit, and GPS',
    ],
    'Operations & maintenance',
    [
      'Localized geofencing alerts (yard, customer, restricted zones)',
      'Advanced engine diagnostics (DTCs, J1939 on heavy trucks)',
      'Integration with FleetCo portal (map, ROs, notifications)',
    ],
  );

  tableSlide(
    pptx,
    'Part 1 · Context',
    'Dedicated telematics box vs company phone',
    ['Dimension', 'Hardware telematics', 'FleetCo phone-first'],
    [
      ['Upfront cost', '$150–$500+ per install', '$0 extra if phone already issued'],
      ['Time to deploy', 'Installer visit or ship/wait', 'App update + driver permissions'],
      ['Engine data', 'Native OBD/J1939', 'Requires optional dongle'],
      ['Driver video AI', 'Vendor-specific DVR', 'Gemini on road/cabin frames'],
      ['Contract lock-in', 'Often multi-year', 'Your existing FleetCo subscription'],
    ],
    [2.4, 4.8, 5.2],
  );

  slide = section(pptx, 'Part 1 · Context', 'Where this fits FleetCo pricing', BRAND.pricing?.[1]?.detail || '');
  twoCol(
    slide,
    'Per-unit SaaS',
    [
      BRAND.pricing?.[0]?.price || '$35/unit/mo',
      BRAND.pricing?.[0]?.detail || 'Portal + driver app',
      'Telematics features become a differentiator inside the same login',
    ],
    'Enterprise',
    [
      'Custom telematics scope',
      'LiveKit, Gemini usage, OBD rollout at scale',
      'Dedicated account team for mixed fleets (light + heavy duty)',
    ],
  );

  // Part 2 — Matrix
  tableSlide(
    pptx,
    'Part 2 · Capability matrix',
    'Can newest iPhone / Android do it without extra vehicle hardware?',
    ['Capability', 'Phone-only?', 'FleetCo today'],
    [
      ['Live GPS while driving', 'Yes — with native app permissions', 'Yes — DriverLocation ~30s while clocked in'],
      ['Geofence enter/exit alerts', 'Yes — server or native regions', 'Partial — map shapes, no auto alerts yet'],
      ['AI distraction / phone use', 'Partial — cloud vision on camera frames', 'Backend built; not on live stream yet'],
      ['Dual camera (road + driver)', 'Yes natively; WebView varies', 'JS dual stream today; native plugin recommended'],
      ['Live dashcam to office', 'Yes — foreground camera + stream', 'Yes — LiveKit or chunked live'],
      ['Live ECU / J1939 diagnostics', 'No — needs vehicle bus adapter', 'Manual DTC entry + AI explain only'],
      ['Harsh braking from vehicle CAN', 'No without bus', 'Could approximate with phone IMU (future)'],
    ],
    [3.2, 3.5, 5.7],
  );

  slide = section(pptx, 'Part 2 · Limits', 'What we will not over-promise on the website', null, true);
  bullets(slide, [
    'Continuous tamper-proof ELD-grade logging from phone sensors alone (FMCSA hardware rules differ from fleet GPS).',
    'Full J1939 parameter groups (fuel rate, DEF, aftertreatment) without a J1939-capable adapter or OEM feed.',
    'DVR-quality 360° coverage — phone mount = one or two angles, not four camera angles.',
    'Background cabin monitoring on iOS when the app is not active — OS privacy limits apply.',
  ], { y: 2.05, color: 'E2E8F0', fontSize: 11 });

  slide = section(pptx, 'Part 2 · Limits', 'What we can promise confidently');
  bullets(slide, [
    'Clocked-in drivers appear on Fleet Map with speed, heading, and trails when GPS is allowed.',
    'Office can watch live dashcam when driver starts Live Dashcam (optional LiveKit for lower latency).',
    'Safety events (distraction, phone_use, etc.) can be stored as DrivingSafetyEvent records with map context.',
    'Customers can receive push/email when geofence rules fire — after server-side geofence engine ships.',
  ]);

  // Part 3 — Today
  illustratedSlide(
    pptx,
    'Part 3 · Today',
    'Driver app home — telematics entry point',
    [
      'Package: org.fleetcomanagement.driver (Capacitor native shell)',
      'Dashcam, Time Clock, POD, inspections from one mobile hub',
      'Permissions gate: camera + location before full features',
      'iOS Safari: camera often requires tap on Dashcam (policy-compliant UX)',
    ],
    'driver-home',
    'FleetCo Driver — mobile home',
    ['Driver routes:', '/driver/home', '/driver/dashcam', '/driver/clock'],
  );

  illustratedSlide(
    pptx,
    'Part 3 · Today',
    'Time clock ties GPS to shifts',
    [
      'useDriverLocation pings every 30 seconds while clocked in',
      'Creates DriverLocation rows: lat, lng, speed, heading, unit, trailer',
      'Source field: driver_app — visible on Fleet Map & Route Dashboard',
      'Offline queue coalesces GPS writes in IndexedDB when cell drops',
    ],
    'driver-clock',
    'Time clock + GPS permission',
    ['Hook: src/hooks/useDriverLocation.js', 'Entity: DriverLocation'],
  );

  illustratedSlide(
    pptx,
    'Part 3 · Today',
    'Portal fleet map — live positions',
    [
      'Fleet Map subscribes to DriverLocation for near-real-time markers',
      'Circle and rectangle overlays support geofence-style visualization',
      'Per-vehicle map colors and unit labels for dispatch clarity',
      'Proposed: evaluate geofence polygons on each ping server-side',
    ],
    'portal-fleet',
    'Fleet units / map context',
    ['Page: FleetMap.jsx', 'Ping interval tunable (10–60s tradeoff)'],
  );

  slide = section(pptx, 'Part 3 · Today', 'Live dashcam pipeline (already shipped)');
  bodyParagraphs(slide, [
    {
      heading: 'Driver actions',
      items: [
        'Start Live Dashcam from driver UI while on shift',
        'Android: DashcamForegroundService keeps camera alive',
        'Modes: LiveKit WebRTC if configured, else chunked upload (~3–5s delay)',
      ],
    },
    {
      heading: 'Office actions',
      items: [
        'Watch live session from portal live stream components',
        'Recordings retained per LiveStreamRecording policy',
        'Safety AI hook point: sample JPEG from stream every N seconds',
      ],
    },
  ]);

  slide = section(pptx, 'Part 3 · Today', 'Safety AI backend (Gemini vision)', null, true);
  bullets(slide, [
    'Module: server/drivingSafetyAi.js — analyzes frames for lane_departure, distraction, phone_use, drowsiness, etc.',
    'Creates DrivingSafetyEvent entities with severity, confidence, lat/lng, speed',
    'Customer flag: driver_safety_ai_enabled can disable per fleet',
    'Requires GEMINI_API_KEY in production; sub-0.55 confidence events filtered out',
    'Gap: analyzeDashcamFrameAsync exists but photo capture path disabled — must attach to live chunks',
  ], { y: 2.0, fontSize: 10.5, color: 'E2E8F0' });

  illustratedSlide(
    pptx,
    'Part 3 · Today',
    'Diagnostics module — shop workflow today',
    [
      'Portal → Diagnostics stores DTC records per vehicle',
      'Supports OBD-II, J1939, J1708 labels — data entry is manual',
      'AI Assistant interprets pasted codes for mechanics',
      'Not connected to driver phone or Bluetooth adapter yet',
    ],
    'portal-vehicle-lookup',
    'Vehicle / diagnostics context',
    ['Auto DTC = proposed Phase 4 with BLE dongle'],
  );

  slide = section(pptx, 'Part 3 · Today', 'Dual camera — current FleetCo code (WebView layer)');
  twoCol(
    slide,
    'What the app does now',
    [
      'startDualCameraStreams() opens road (environment) then cabin (user) via getUserMedia',
      'Returns dualSupported: true only if BOTH streams open — see nativeBridge.js',
      'Customer toggle: driver_dual_camera_enabled on Customer / Driver Media',
      'Dashcam mode dual_monitoring exists in server DASHCAM_MODES list',
    ],
    'Gap vs product goal',
    [
      'Capacitor WebView on iPhone often fails second stream → road-only fallback',
      'Live dashcam today primarily streams road camera to office',
      'Safety AI (analyzeDashcamFrameAsync) ready but not fed from live dual streams yet',
      'Next step: native dual-cam capture (Part 3B review)',
    ],
  );

  // —— Part 3B · Dual-camera platform review ——
  slide = section(pptx, 'Part 3B · Dual camera', 'Product goal: two cameras, one session', null, true);
  bullets(slide, [
    'Rear / “back” camera (environment): wide view of lanes, traffic, road hazards — mounted on dash or windshield.',
    'Front / “selfie” camera (user): faces the driver (not screen recording) — detects glance away, phone at ear, head nodding.',
    'Both should run together while the driver is clocked in and Live Dashcam (or dual monitoring) is active.',
    'Office receives live road video; AI periodically analyzes JPEG samples from road AND driver cameras.',
  ], { y: 2.05, fontSize: 10.5, color: 'E2E8F0' });

  slide = section(pptx, 'Part 3B · Dual camera', 'Physical setup on the phone');
  diagramBox(
    slide,
    0.55,
    1.95,
    12.2,
    5.0,
    'Mounting (typical OTR cab)',
    [
      '[Windshield mount — landscape]',
      '  Back camera → road ahead (primary live stream to fleet)',
      '  Front camera → driver face (cabin AI stream)',
      '',
      'Tips: avoid blocking lens; charge continuously;',
      'Android foreground service / iOS keep-awake while recording.',
    ],
  );

  slide = section(pptx, 'Part 3B · Dual camera', 'Why “two getUserMedia calls” is not enough on iPhone');
  bullets(slide, [
    'FleetCo Driver runs as Capacitor — camera access is often WKWebView getUserMedia, same family as Safari.',
    'Apple documents one active capture session per app for many web flows; second facingMode may fail silently.',
    'That matches our code comment: “iOS may only allow one stream — dualSupported: false on fallback.”',
    'For reliable dual recording on iPhone 11 and newer (A12+), use AVFoundation AVCaptureMultiCamSession in native code.',
  ]);

  tableSlide(
    pptx,
    'Part 3B · iPhone review',
    'Apple simultaneous front + rear (native)',
    ['Topic', 'Detail'],
    [
      ['API', 'AVCaptureMultiCamSession + supportedMultiCamDeviceSets (iOS 13+)'],
      ['Hardware', 'iPhone / iPad with A12 or later recommended (Apple sample requirement)'],
      ['Capability', 'Record front + back into separate outputs or PiP-style preview (Apple AVMultiCamPiP sample)'],
      ['Limits', 'One MultiCam session per app; no cloning one camera to two outputs; watch thermal/system pressure'],
      ['Pressure cost', 'Apple WWDC guidance: sustained capture depends on systemPressureCost — long haul may need lower resolution'],
      ['FleetCo action', 'Capacitor plugin: startDualNativeCapture → two JPEG/video buffers to JS'],
    ],
    [2.6, 9.8],
  );

  slide = section(pptx, 'Part 3B · iPhone review', 'iPhone — what to tell sales & drivers');
  twoCol(
    slide,
    'Supported experience (after native plugin)',
    [
      'iPhone 11+ class devices: driver + road together in FleetCo Driver app',
      'Distraction AI uses front-camera samples (cabin prompt in Safety AI)',
      'Road AI uses rear-camera samples (lane, tailgating, etc.)',
      'Live office view can remain road-primary; cabin snapshots in safety inbox',
    ],
    'Not supported / degraded',
    [
      'Very old iPhones pre-A12 — single camera only',
      'Mobile Safari-only users — gesture-limited, expect road-only',
      'Background-only cabin monitoring when app killed — iOS privacy blocks',
      'Screen recording of dispatch app — different feature; not used for safety AI',
    ],
  );

  tableSlide(
    pptx,
    'Part 3B · Android review',
    'Android simultaneous front + rear (native)',
    ['Topic', 'Detail'],
    [
      ['API level', 'Android 11 (API 30)+ concurrent camera streaming in Camera2'],
      ['Discovery', 'CameraManager.getConcurrentCameraIds() + isConcurrentSessionConfigurationSupported()'],
      ['Feature flag', 'PackageManager.FEATURE_CAMERA_CONCURRENT on some OEM builds'],
      ['CameraX', 'High-level CameraX does NOT select front + back together — use Camera2 for dual'],
      ['OEM reality', 'Must test Samsung, Pixel, Motorola, etc. — HAL support varies by model'],
      ['FleetCo action', 'Native module mirrors iOS plugin; fallback to current JS dual stream if unsupported'],
    ],
    [2.6, 9.8],
  );

  slide = section(pptx, 'Part 3B · Android review', 'Runtime detection flow (recommended)');
  bullets(slide, [
    'On app launch (or first dashcam start): query concurrent camera ID pairs for desired resolutions.',
    'If supported: start native dual session — road 720p + driver 480p (example tiers for thermal/data).',
    'If unsupported: dualSupported false — show driver message “Road monitoring only on this device.”',
    'Log device model + support flag to portal for fleet IT (know which units need upgrade phones).',
  ]);

  tableSlide(
    pptx,
    'Part 3B · Comparison',
    'Recording driver + road at the same time — summary',
    ['Layer', 'iPhone (recent)', 'Android (recent)', 'FleetCo today'],
    [
      ['Browser / WebView only', 'Usually one stream', 'Often two streams', 'startDualCameraStreams — mixed results'],
      ['Native dual capture', 'Yes — MultiCam', 'Yes — if OEM supports concurrent', 'Not shipped yet — recommended'],
      ['Live stream to office', 'Road cam practical', 'Road cam practical', 'LiveKit or chunked — road focus'],
      ['AI on driver cam', 'Needs native or periodic tap', 'Strongest on dual-native Android', 'Cabin prompt ready in Gemini'],
      ['Fleet policy', 'Issue A12+ iPhones for safety fleets', 'Prefer API 30+ with concurrent feature', 'Toggle dual camera per customer'],
    ],
    [2.4, 3.2, 3.2, 3.6],
  );

  slide = section(pptx, 'Part 3B · Dual camera', 'Recording vs AI sampling (architecture choice)');
  twoCol(
    slide,
    'Full dual video recording',
    [
      'Two encoded tracks (MP4 or WebM chunks) — higher storage and upload cost',
      'Best for litigation-grade review of distraction incidents',
      'Requires native pipeline on both platforms for reliability',
    ],
    'Frame sampling for AI (v1 recommendation)',
    [
      'Continue live road stream as today; sample JPEG every 5–15s from each camera',
      'Upload frames → analyzeDashcamFrameAsync with camera_facing road vs cabin',
      'Store thumbnail on DrivingSafetyEvent; optional short clip on high severity',
      'Lower cost than dual full video; sufficient for coaching workflow',
    ],
  );

  slide = section(pptx, 'Part 3B · Dual camera', 'End-to-end flow with AI distraction review');
  diagramBox(
    slide,
    0.55,
    1.95,
    12.2,
    5.0,
    'PhonePulse dual-cam + AI',
    [
      '[Native or JS dual capture]',
      '  Rear frames → live stream + road AI (lane, tailgating, …)',
      '  Front frames → cabin AI (distraction, phone_use, drowsiness, …)',
      '[FleetCo API] drivingSafetyAi.js → DrivingSafetyEvent',
      '[Portal] Safety inbox · map pin · acknowledge · coaching',
    ],
  );

  tableSlide(
    pptx,
    'Part 3B · AI distraction',
    'Distraction & behavior types (cabin / driver camera)',
    ['AI type', 'What it means', 'Typical manager action'],
    [
      ['distraction', 'Eyes not on road environment — looking down/side', 'Coaching reminder'],
      ['phone_use', 'Phone at ear or visible texting', 'Policy violation review'],
      ['drowsiness', 'Head nod, eyes closed pattern', 'Break / fitness for duty check'],
      ['no_seatbelt', 'Belt not visible when expected', 'Safety bulletin'],
      ['impaired', 'Low-confidence cues only', 'Human review — never auto-accuse'],
    ],
    [2.2, 5.5, 4.7],
  );

  tableSlide(
    pptx,
    'Part 3B · AI distraction',
    'Road camera AI (supports distraction context)',
    ['AI type', 'What it means', 'Pairs with driver cam'],
    [
      ['lane_departure / lane_split', 'Weaving or drifting', 'Confirms driver not watching road'],
      ['tailgating', 'Following too close', 'May correlate with distraction event same timestamp'],
      ['harsh_braking', 'Vision-inferred sudden slow', 'Could trigger burst sampling on both cams'],
      ['other / road hazard', 'Debris, weather, etc.', 'Operational alert — not discipline'],
    ],
    [2.4, 5.2, 4.8],
  );

  slide = section(pptx, 'Part 3B · Dual camera', 'Implementation phases (FleetCo engineering)');
  bullets(slide, [
    'Phase A — Wire live dashcam to emit paired road+cabin JPEGs when dualSupported (Android JS path) + Safety AI on both.',
    'Phase B — iOS + Android Capacitor DualCam plugin (MultiCam + Camera2 concurrent) with feature detection.',
    'Phase C — Portal Safety inbox UI, filters, retention policy, customer driver_safety_ai_enabled.',
    'Phase D — Optional dual full-video upload for enterprise; LiveKit secondary track or chunked cabin channel.',
  ]);

  slide = section(pptx, 'Part 3B · Dual camera', 'QA device matrix (pilot before marketing claims)');
  bullets(slide, [
    'iPhone 13/14/15/16 on Capacitor production build — verify native plugin dual capture 30+ min',
    'Samsung Galaxy S series + Pixel 8/9 — concurrent API true/false logged',
    'Budget Android without FEATURE_CAMERA_CONCURRENT — confirm graceful road-only UX',
    'Compare dualSupported flag from JS vs native probe — single telemetry field in portal',
  ]);

  // Part 4 — Proposed
  slide = section(pptx, 'Part 4 · Proposed', 'Engineering workstreams (updated priority)', null, true);
  bullets(slide, [
    'WS0 — Native dual camera (iOS MultiCam + Android concurrent Camera2) with WebView fallback',
    'WS1 — Sample road + driver frames from live dashcam → Gemini → DrivingSafetyEvent inbox',
    'WS2 — Geofence definitions + enter/exit/dwell alerts (push, email, PortalActivity)',
    'WS3 — Background location hardening (Capacitor Geolocation, iOS Always, Android foreground service)',
    'WS4 — Optional BLE OBD/J1939 adapter → auto DiagnosticCode rows',
  ], { y: 2.05, fontSize: 10, color: 'E2E8F0' });

  slide = section(pptx, 'Part 4 · Proposed', 'Target architecture after changes');
  diagramBox(
    slide,
    0.55,
    1.95,
    12.2,
    5.0,
    'Data flow',
    [
      '[Driver phone]',
      '  Dual cam: rear (road) + front (driver) native or JS fallback',
      '  GPS watch → POST DriverLocation (10–30s)',
      '  Live dashcam + sampled JPEGs → road + cabin → Safety AI',
      '  Optional BLE → OBD read → POST DiagnosticCode',
      '[FleetCo API]',
      '  Geofence engine → notifications',
      '  drivingSafetyAi → DrivingSafetyEvent',
      '[Portal]',
      '  Fleet Map · Safety inbox · Diagnostics · Reports',
    ],
  );

  tableSlide(
    pptx,
    'Part 4 · Proposed',
    'Before vs after (demo-ready state)',
    ['Feature', 'Before', 'After (proposed)'],
    [
      ['Yard exit alert', 'Manual map check', 'Auto alert when unit leaves polygon'],
      ['Customer arrival', 'Driver texts dispatch', 'Geofence enter + ETA on map'],
      ['Distraction event', 'Not wired to live video', 'AI event with snapshot + map pin'],
      ['Fault code', 'Shop scans or types code', 'Optional auto-pull on ignition (dongle)'],
      ['Background GPS', 'Best-effort browser/Capacitor', 'Native background + compliance UX'],
    ],
    [2.8, 4.6, 5.0],
  );

  // Part 5 — Geofencing
  slide = section(pptx, 'Part 5 · Geofencing', 'Definitions fleet managers need');
  bullets(slide, [
    'Named zones: home yard, customer dock, fuel stop, no-go areas, state lines for IFTA hints',
    'Shapes: circle (radius m), rectangle (bounding box), polygon (future)',
    'Rules: on_enter, on_exit, dwell_minutes, speed_cap_inside_zone',
    'Scope: per customer_id, optional per vehicle group or single unit',
  ]);

  slide = section(pptx, 'Part 5 · Geofencing', 'Server-side evaluation (recommended v1)');
  bullets(slide, [
    'On each DriverLocation create/update, test point-in-region for active fences',
    'Debounce: require 2 consecutive pings outside before exit (GPS jitter)',
    'Store last fence state on driver/session to detect transitions',
    'Emit PortalActivity + webhook + FCM push to fleet_manager roles',
  ]);

  slide = section(pptx, 'Part 5 · Geofencing', 'Native region monitoring (optional v2)');
  twoCol(
    slide,
    'iOS Core Location',
    [
      'Register up to 20 regions per app (plan zone count carefully)',
      'Low power enter/exit at OS level',
      'Confirm with a GPS ping when event fires',
    ],
    'Android Geofencing API',
    [
      'Similar region limits; works with foreground service',
      'Combine with FleetCo Driver clocked-in state',
      'Fallback to server-only if permission denied',
    ],
  );

  tableSlide(
    pptx,
    'Part 5 · Geofencing',
    'Ping interval tradeoffs',
    ['Interval', 'Pros', 'Cons'],
    [
      ['10 seconds', 'Faster fence detection', 'More battery + data + DB writes'],
      ['30 seconds (today)', 'Balanced default', 'Up to 30s alert delay at highway speed'],
      ['60 seconds', 'Minimal backend load', 'Poor for tight urban geofences'],
      ['Native geofence + 30s ping', 'Best battery', 'Extra native dev + testing'],
    ],
    [2.2, 5.0, 5.2],
  );

  slide = section(pptx, 'Part 5 · Geofencing', 'Demo scenario A — yard departure');
  bullets(slide, [
    'Setup: draw yard polygon around terminal in Fleet Map admin (proposed UI)',
    'Driver clocks in on Unit FC101; GPS pings begin',
    'Rule: notify dispatch when any active unit exits yard between 06:00–18:00',
    'Expected: push + portal banner within one ping interval after boundary cross',
    'Audit log: geofence_event_id, driver, unit, lat/lng, speed',
  ]);

  slide = section(pptx, 'Part 5 · Geofencing', 'Demo scenario B — customer arrival');
  bullets(slide, [
    'Setup: geofence at consignee address linked to active load DEMO-8801',
    'Rule: on_enter → mark load status “At delivery” + notify customer portal user',
    'Optional: require dwell 3 min before POD prompt unlocks',
    'Map: highlight unit icon green inside customer zone',
  ]);

  slide = section(pptx, 'Part 5 · Geofencing', 'Demo scenario C — restricted zone');
  bullets(slide, [
    'Setup: no-go polygon (bridge weight limit, tunnel hazmat ban)',
    'Rule: on_enter → critical alert to safety manager + driver push',
    'Dashboard widget: “Geofence violations last 7 days”',
    'Export CSV for insurance or compliance review',
  ]);

  illustratedSlide(
    pptx,
    'Part 5 · Geofencing',
    'Portal map — where managers will review alerts',
    [
      'Existing Fleet Map already shows driver markers and shapes',
      'Proposed: Geofence layer toggle + alert history panel',
      'Click alert → fly to map location + link to live dashcam if session active',
      'Customer-scoped: only their units and fences',
    ],
    'portal-dashboard',
    'Operations dashboard context',
    ['Alerts also surface on Dashboard KPI cards (proposed)'],
  );

  // Part 6 — AI Safety
  slide = section(pptx, 'Part 6 · AI safety', 'How AI reviews video for distracted driving', null, true);
  bullets(slide, [
    'Not one monolithic “video AI” — FleetCo sends still frames (or short bursts) to Gemini with road vs cabin prompts (drivingSafetyAi.js).',
    'Driver-facing camera → distraction, phone_use, drowsiness, no_seatbelt, impaired (review-only).',
    'Road-facing camera → lane issues, tailgating, harsh_braking — corroborates inattention.',
    'Each hit creates DrivingSafetyEvent with severity, confidence ≥0.55, GPS, speed, optional snapshot.',
    'See Part 3B tables for full event type definitions.',
  ], { y: 2.05, fontSize: 10, color: 'E2E8F0' });

  slide = section(pptx, 'Part 6 · AI safety', 'Sampling strategy for cost control');
  twoCol(
    slide,
    'When to analyze',
    [
      'Only while live dashcam active AND speed > 10 mph',
      'Road frame every 10s; cabin every 15s if dual camera',
      'Burst mode: 1 fps for 30s after harsh deceleration (IMU trigger)',
    ],
    'When to skip',
    [
      'Parked / idling > 5 min',
      'Customer driver_safety_ai_enabled = false',
      'Missing GEMINI_API_KEY — log once, no user error spam',
    ],
  );

  tableSlide(
    pptx,
    'Part 6 · AI safety',
    'Illustrative Gemini cost model (planning only)',
    ['Scenario', 'Assumption', 'Rough monthly vision cost'],
    [
      ['Small pilot', '5 drivers, 4 hr/day, 1 frame/15s', '$15–$80 depending on model'],
      ['Mid fleet', '20 drivers, 8 hr/day, 1 frame/10s', '$80–$400'],
      ['Aggressive sampling', 'Same fleet, 1 frame/3s', '3–5× higher — avoid unless enterprise pays'],
      ['Mitigation', 'Speed gates + dual-rate road/cabin', 'Keeps margin inside SaaS fee or add-on'],
    ],
    [2.4, 5.0, 5.0],
  );

  slide = section(pptx, 'Part 6 · AI safety', 'Demo scenario — phone use (driver camera)');
  bullets(slide, [
    'Use Android with dualSupported true OR iPhone with native DualCam plugin once shipped',
    'Driver starts Live Dashcam; confirm front camera preview active (driver face visible)',
    'Safe staged test: parked, hold phone to ear — cabin frame sampled → cabin Gemini prompt',
    'Within 1–2 sample intervals, DrivingSafetyEvent type phone_use in portal Safety inbox',
    'Manager sees cabin snapshot thumbnail, map pin, confidence, acknowledge / false positive',
  ]);

  slide = section(pptx, 'Part 6 · AI safety', 'Demo scenario — distraction / drowsiness (driver camera)');
  bullets(slide, [
    'Front camera captures glance away from windshield or head nod (staged while parked for demo)',
    'AI returns distraction or drowsiness with description text from cabin prompt',
    'Cross-check timestamp with road camera event (lane_split) if both streams active',
    'Fleet manager filters by driver, date, severity; export weekly summary (proposed report)',
  ]);

  tableSlide(
    pptx,
    'Part 6 · AI safety',
    'Dual camera + AI — demo platform matrix',
    ['Platform', 'Road + driver together', 'Distraction AI quality', 'Demo note'],
    [
      ['Android + native dual (target)', 'Yes when concurrent API OK', 'High — continuous cabin frames', 'Primary PhonePulse demo kit'],
      ['Android WebView only', 'Sometimes', 'Medium — test dualSupported flag', 'Phase A before native plugin'],
      ['iPhone + native MultiCam (target)', 'Yes A12+', 'High — continuous cabin frames', 'Required for parity with Android'],
      ['iPhone WebView only', 'Usually road only', 'Low for in-cab — road AI only', 'Do not sell as full distraction suite'],
      ['Mobile Safari', 'Gesture / single cam', 'Not for production telematics', 'Driver should install Capacitor app'],
    ],
    [2.8, 3.4, 3.4, 3.4],
  );

  slide = section(pptx, 'Part 6 · AI safety', 'Human review & false positives');
  bullets(slide, [
    'Never auto-terminate drivers on AI alone — use review queue',
    'Confidence threshold default 0.55 (already in code); raise to 0.7 for stricter fleets',
    'Allow fleet_manager to mark “false positive” to improve future tuning prompts',
    'Retain frames per retention policy — align with privacy policy & state law',
  ]);

  // Part 7 — Diagnostics
  slide = section(pptx, 'Part 7 · Diagnostics', 'Why phones cannot read the ECU alone');
  bullets(slide, [
    'Engine control units speak OBD-II (light duty) or SAE J1939/J1708 (many trucks)',
    'Phone has no physical connection to the diagnostic port without an adapter',
    'Bluetooth LE OBD dongles bridge phone ↔ OBD port (ELM327 family)',
    'Heavy-duty 9-pin requires J1939-capable adapter — consumer OBD often insufficient',
  ]);

  tableSlide(
    pptx,
    'Part 7 · Diagnostics',
    'Optional hardware SKUs (per vehicle, one-time)',
    ['Tier', 'Hardware', 'Typical price', 'Gets you'],
    [
      ['Light duty BLE', 'OBD-II ELM327 BLE', '$25–$80', 'Stored DTCs, some live PIDs'],
      ['Heavy duty', 'J1939 Bluetooth adapter', '$120–$400', 'Truck DTCs on supported models'],
      ['OEM telematics', 'Factory modem', 'Included in truck', 'API integration — separate project'],
      ['Phone only', 'None', '$0', 'Manual codes + AI explain (current)'],
    ],
    [2.0, 3.5, 2.5, 4.4],
  );

  slide = section(pptx, 'Part 7 · Diagnostics', 'Proposed BLE integration flow');
  bullets(slide, [
    'Capacitor BLE plugin in Driver app — pair once per vehicle profile',
    'On shift start: connect to dongle, poll DTCs every 15 min or on MIL change',
    'POST new codes to DiagnosticCode entity with scan_type auto',
    'Portal Diagnostics list updates; AI explain runs on new codes',
    'Shop notification when critical severity code appears on active load',
  ]);

  slide = section(pptx, 'Part 7 · Diagnostics', 'Demo scenario — auto DTC pull');
  bullets(slide, [
    'Shop plugs BLE dongle into test pickup; driver pairs in Driver Settings',
    'Inject or clear test code P0301 on bench (safe environment)',
    'Verify code appears in portal within one poll cycle',
    'Create draft RO from diagnostic row (proposed one-click)',
  ]);

  slide = section(pptx, 'Part 7 · Diagnostics', 'Heavy-duty honesty slide for sales');
  bullets(slide, [
    'Mixed fleets: offer phone-first GPS/AI for all units; OBD dongle SKU for units that support it',
    'For brand-new Class 8 with OEM telematics, sell API import instead of dongle',
    'Website copy: “Automatic fault capture available with optional adapter”',
    'Avoid claiming universal J1939 live PGN streaming without certification/testing',
  ]);

  // Part 8 — Architecture
  slide = section(pptx, 'Part 8 · Architecture', 'Capacitor app configuration today', null, true);
  bullets(slide, [
    'appId: org.fleetcomanagement.driver — webDir: dist',
    'Plugins: Camera, Geolocation permissions declared in capacitor.config.json',
    'Custom Android DashcamService plugin for foreground recording',
    'driver-sw.js — background sync for offline API queue (Android Chrome)',
  ], { y: 2.05, fontSize: 10.5, color: 'E2E8F0' });

  slide = section(pptx, 'Part 8 · Architecture', 'Key server entities');
  twoCol(
    slide,
    'Location & safety',
    [
      'DriverLocation — GPS pings',
      'DrivingSafetyEvent — AI alerts',
      'LiveStreamSession / Recording — dashcam',
      'DashcamFrame — snapshot store (when enabled)',
    ],
    'Maintenance',
    [
      'DiagnosticCode — DTC records',
      'Vehicle — unit linkage',
      'PortalActivity — audit feed (geofence events)',
      'Customer — feature flags per fleet',
    ],
  );

  slide = section(pptx, 'Part 8 · Architecture', 'Optional LiveKit layer');
  bullets(slide, [
    'When LIVEKIT_* env vars set, startLiveVideoStream returns livekitUrl + token',
    'Sub-second office viewing; higher infra cost than chunked mode',
    'Safety AI still samples JPEGs from driver upload path regardless of mode',
    'Production readiness card in portal documents configuration source',
  ]);

  slide = section(pptx, 'Part 8 · Architecture', 'Security & multi-tenant isolation');
  bullets(slide, [
    'DriverLocation and safety events scoped by customer_id / entityScope rules',
    'Drivers only POST for their own user_id; managers see customer fleet only',
    'Media stored via mediaStorage — signed URLs, not public buckets',
    'Geofence admin limited to fleet_manager / customer admin roles',
  ]);

  slide = section(pptx, 'Part 8 · Architecture', 'Offline & poor connectivity');
  bullets(slide, [
    'offlineSync coalesces DriverLocation writes in IndexedDB',
    'Dashcam chunks queue until cell returns — driver sees pending count',
    'Geofence evaluation uses server time of ping arrival (note delay in UI)',
    'Safety AI can backlog analyze when uploads resume — stamp original captured_at',
  ]);

  slide = section(pptx, 'Part 8 · Architecture', 'Environment variables checklist');
  bullets(slide, [
    'GEMINI_API_KEY — required for Safety AI vision',
    'LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET — optional live WebRTC',
    'FCM / push credentials — geofence and safety push alerts',
    'SITE_URL — marketing screenshot scripts only',
  ]);

  // Part 9 — Platform
  tableSlide(
    pptx,
    'Part 9 · Platforms',
    'iPhone 15/16 vs flagship Android (2024–2026)',
    ['Topic', 'iPhone', 'Android'],
    [
      ['Background GPS', 'Always permission + App Store justification', 'Foreground service + permissions'],
      ['Dual camera', 'Typically one active stream', 'Many models support dual'],
      ['Dashcam while navigating', 'User must keep app foreground often', 'Foreground service helps'],
      ['BLE OBD', 'CoreBluetooth via Capacitor plugin', 'Standard BLE scanning'],
      ['App distribution', 'TestFlight + App Store', 'Play internal testing (live today)'],
    ],
    [2.8, 4.6, 5.0],
  );

  slide = section(pptx, 'Part 9 · Platforms', 'Recommended demo device kit');
  bullets(slide, [
    'Primary: Samsung or Pixel on latest Android — dual camera + foreground service demo',
    'Secondary: iPhone on Capacitor build — road AI + geofence + live view',
    'Mount: vent mount + charging cable (not “telematics hardware” but required for quality)',
    'Test account: clocked-in driver linked to FC101 / demo customer fleet',
  ]);

  slide = section(pptx, 'Part 9 · Platforms', 'Permissions UX copy (drivers)');
  bullets(slide, [
    'Location: “FleetCo needs your location while you’re clocked in so dispatch can see the unit and geofence alerts work.”',
    'Camera: “Road camera is used for live dashcam and safety monitoring when your fleet enables it.”',
    'iOS Always: link to Settings screenshot in driver FAQ (proposed help article)',
    'Opt-out: limited mode without camera — GPS-only telematics tier (policy decision)',
  ]);

  // Part 10 — Cost
  tableSlide(
    pptx,
    'Part 10 · Costs',
    'One-time costs',
    ['Item', 'Cost', 'Notes'],
    [
      ['Company phone (existing)', '$0 marginal', 'Already budgeted ops expense'],
      ['Phone mount + charger', '$15–$40/unit', 'Strongly recommended for dashcam angle'],
      ['BLE OBD optional', '$25–$400/unit', 'Only if auto diagnostics sold'],
      ['Apple Developer Program', '$99/year', 'iOS distribution'],
      ['Google Play', '$25 one-time', 'Already used for driver app'],
    ],
    [3.5, 2.5, 6.4],
  );

  tableSlide(
    pptx,
    'Part 10 · Costs',
    'Recurring costs (beyond base SaaS)',
    ['Item', 'Driver scale', 'Order of magnitude'],
    [
      ['Gemini Safety AI', '20 drivers, moderate sampling', '$80–$400/mo — model dependent'],
      ['LiveKit Cloud', '5 concurrent viewers', '$50–$200/mo or self-host'],
      ['Extra GPS storage', '30s pings', 'Usually negligible on Postgres'],
      ['Push notifications', 'FCM/APNs', 'Free at fleet scale'],
      ['Pass-through pricing', 'Enterprise', 'Bill AI usage as add-on line item'],
    ],
    [3.2, 4.0, 5.2],
  );

  slide = section(pptx, 'Part 10 · Costs', 'Engineering effort estimate');
  bullets(slide, [
    'Geofence CRUD + server engine + notifications: ~1.5–2 weeks',
    'Wire Safety AI to live snapshot pipeline + portal inbox: ~1 week',
    'Background location hardening iOS/Android: ~1.5–2 weeks',
    'BLE OBD MVP (light duty): ~2–3 weeks; heavy-duty J1939: +2–4 weeks',
    'QA field pilot + privacy review: ~1 week parallel',
  ]);

  slide = section(pptx, 'Part 10 · Costs', 'ROI narrative for website / sales');
  bullets(slide, [
    'Avoid $200+ hardware × 40 units = $8,000 upfront vs app enablement',
    'Single portal login — no separate telematics vendor training',
    'Upsell: “Safety AI add-on” + “Auto diagnostics adapter kit”',
    'Enterprise custom: LiveKit dedicated + SLA',
  ]);

  // Part 11 — Legal
  slide = section(pptx, 'Part 11 · Legal & privacy', 'Driver consent & notice', null, true);
  bullets(slide, [
    'Update Privacy policy — camera, location, AI analysis purposes',
    'Employee handbook addendum for in-cab monitoring where required by state',
    'California / Illinois / other two-party consent states — legal review for audio (mute audio if unsure)',
    'Customer agreement: fleet owns policy; FleetCo is processor',
  ], { y: 2.05, fontSize: 10.5, color: 'E2E8F0' });

  slide = section(pptx, 'Part 11 · Legal & privacy', 'Data retention');
  bullets(slide, [
    'Define retention for DrivingSafetyEvent snapshots (e.g. 90 days default)',
    'DriverLocation history — align with IFTA/reporting needs',
    'Right-to-delete requests — map to user_id and media blobs',
    'Export for litigation hold — admin-only function (proposed)',
  ]);

  slide = section(pptx, 'Part 11 · Legal & privacy', 'FMCSA / ELD clarification');
  bullets(slide, [
    'This telematics package is not a certified ELD replacement unless you explicitly build and certify ELD mode',
    'GPS + dashcam + geofence complements hours-of-service tools',
    'Marketing: “fleet visibility and safety” not “DOT certified logging” unless certified',
  ]);

  // Part 12 — Roadmap
  slide = section(pptx, 'Part 12 · Roadmap', 'Phase plan (suggested)');
  bullets(slide, [
    'P0 (4–6 weeks): Geofence alerts + background GPS + Safety AI on live frames + portal inbox',
    'P1 (6–10 weeks): Geofence admin UI on map, reports, customer notifications tuning',
    'P2 (10–16 weeks): BLE OBD light duty, RO auto-create from DTC, IMU harsh event hints',
    'P3 (enterprise): OEM telematics API feeds, custom SLAs, dedicated LiveKit',
  ]);

  slide = section(pptx, 'Part 12 · Roadmap', 'Field pilot — 1 week with a customer');
  bullets(slide, [
    'Day 1: Enable test customer, 2–3 drivers, permissions training',
    'Day 2–4: Run loads with live dashcam + geofence test zones',
    'Day 5: Review Safety inbox false positive rate; tune intervals',
    'Day 6–7: Manager feedback session; prioritize P1 items',
  ]);

  slide = section(pptx, 'Part 12 · Roadmap', 'Success metrics');
  twoCol(
    slide,
    'Technical',
    [
      '≥95% GPS pings received while clocked in',
      '<60s geofence alert latency (p95)',
      'Safety AI events reviewable within 5 min of occurrence',
      'Zero cross-customer data leaks in QA audit',
    ],
    'Business',
    [
      'Customer willing to expand from pilot to paid add-on',
      'Support tickets per driver < 0.5 during pilot week',
      'Clear website copy approved by leadership',
      'Cost per driver per month documented',
    ],
  );

  // Part 13 — Demo script
  slide = section(pptx, 'Part 13 · Live demo script', 'Pre-flight (15 minutes before)', null, true);
  bullets(slide, [
    'Confirm API deployed with GEMINI_API_KEY and test customer driver_safety_ai_enabled true',
    'Driver phone: logged in, clocked in on FC101, Live Dashcam tested once on Wi-Fi',
    'Office: Fleet Map open; second screen for Safety inbox (when shipped)',
    'Printed yard geofence coordinates or admin UI ready',
  ], { y: 2.05, fontSize: 10.5, color: 'E2E8F0' });

  slide = section(pptx, 'Part 13 · Live demo script', 'Step 1 — Show live map ping');
  bullets(slide, [
    'Open portal Fleet Map — locate test driver marker',
    'Point out speed, heading, unit label, trail',
    'Explain 30s ping (or 10s if tuned for demo)',
    'Toggle customer view-as to prove tenant isolation',
  ]);

  slide = section(pptx, 'Part 13 · Live demo script', 'Step 2 — Enable dual camera + live dashcam');
  bullets(slide, [
    'Customer portal Driver Media: confirm dual camera enabled for test fleet',
    'Driver phone: verify dualSupported (Android) or native DualCam (iOS when available)',
    'Dashcam tab → Start Live Dashcam — road live to office; driver cam feeding AI samples',
    'Office: live viewer (road) + Safety inbox (driver cam events)',
  ]);

  slide = section(pptx, 'Part 13 · Live demo script', 'Step 3 — Trigger geofence (after build)');
  bullets(slide, [
    'Drive or simulate route crossing yard boundary (or replay GPX in staging)',
    'Show dispatch notification and PortalActivity row',
    'Open map fly-to on alert coordinates',
    'Optional: customer email template preview',
  ]);

  slide = section(pptx, 'Part 13 · Live demo script', 'Step 4 — Safety AI event');
  bullets(slide, [
    'With sampling enabled, perform safe staged distraction test or use staging fixture',
    'Refresh Safety inbox — show event_type, severity, confidence',
    'Open linked snapshot and map pin',
    'Demonstrate acknowledge / false positive workflow',
  ]);

  slide = section(pptx, 'Part 13 · Live demo script', 'Step 5 — Diagnostics path');
  bullets(slide, [
    'Today: show manual DiagnosticModal + AI code explain',
    'Future: show BLE paired driver app pulling P0301',
    'Link diagnostic to vehicle FC101 history tab',
    'Close with optional dongle SKU pricing slide',
  ]);

  // Part 14 — Website
  slide = section(pptx, 'Part 14 · Website copy', 'Hero message (draft)');
  bullets(slide, [
    'Headline: “Telematics built into the driver app you already use.”',
    'Sub: Live GPS, geofence alerts, AI safety monitoring, and live dashcam — no extra black box required.',
    'Footnote: Optional OBD adapter for automatic fault codes on supported vehicles.',
    'CTA: Book demo · Enterprise telematics quote',
  ]);

  slide = section(pptx, 'Part 14 · Website copy', 'Feature bullets for marketing page');
  twoCol(
    slide,
    'Include',
    [
      'Real-time fleet map with driver app GPS',
      'Configurable geofence notifications',
      'AI-assisted driver safety events',
      'Live video to dispatch (optional low-latency LiveKit)',
    ],
    'Exclude / qualify',
    [
      '“Full J1939 telematics” without adapter',
      '“Certified ELD” unless certified',
      'Identical iOS/Android dual-camera claims',
      'Unlimited AI with no usage note for enterprise',
    ],
  );

  tableSlide(
    pptx,
    'Part 14 · Website copy',
    'Comparison table for site vs hardware telematics',
    ['', 'Traditional', 'FleetCo'],
    [
      ['Hardware install', 'Required', 'Optional (OBD only)'],
      ['Time to live', 'Days–weeks', 'Hours (app update)'],
      ['Video AI', 'Vendor lock-in', 'Gemini-powered, your portal'],
      ['Shop diagnostics', 'Sometimes included', 'Portal + optional BLE'],
      ['Single sign-on', 'Separate portal', 'Same FleetCo login'],
    ],
    [2.8, 4.6, 4.8],
  );

  // Appendix
  slide = section(pptx, 'Appendix', 'Related FleetCo decks & downloads');
  bullets(slide, [
    'FleetCo-Smartphone-Telematics-Demo.pptx — this deck (80+ slides, dual-camera + AI focus)',
    'FleetCo-System-Deep-Dive-Review.pptx — UI screenshots + gap analysis',
    'FleetCo-System-Capabilities-Review.pptx — module catalog',
    'Regenerate telematics deck: npm run marketing:telematics',
    `Download URL: ${BRAND.url}/marketing/FleetCo-Smartphone-Telematics-Demo.pptx`,
  ]);

  slide = section(pptx, 'Appendix', 'Source code references (for engineering review)');
  bullets(slide, [
    'src/hooks/useDriverLocation.js — GPS ping interval',
    'src/components/mobile/DriverDeviceProvider.jsx — dual camera',
    'server/drivingSafetyAi.js — Gemini Safety AI',
    'server/liveStream.js — live dashcam sessions',
    'src/pages/Diagnostics.jsx — DTC tracking UI',
    'capacitor.config.json — org.fleetcomanagement.driver',
  ], { fontSize: 10 });

  slide = section(pptx, 'Appendix', 'QA audit command');
  bullets(slide, [
    'After generating: node scripts/audit-pptx-content.mjs marketing/FleetCo-Smartphone-Telematics-Demo.pptx --min-slides=50',
    'Fails if any slide has fewer than 48 characters of visible text',
    'Screenshot frames live in marketing/manual-frames/*.png',
    'Refresh UI shots: npm run marketing:deep-dive -- --refresh',
  ]);

  // Closing
  slide = pptx.addSlide();
  slideNum += 1;
  slide.background = { color: NAVY };
  slide.addShape(pptx.shapes.RECTANGLE, { x: 0, y: 0, w: '100%', h: 0.08, fill: { color: AMBER } });
  slide.addText('Questions & next steps', { x: 0.7, y: 2.2, w: 11, h: 0.8, fontSize: 36, bold: true, color: WHITE });
  slide.addText(`Approve P0 roadmap · Run field pilot · Update ${BRAND.website} telematics page`, {
    x: 0.7,
    y: 3.2,
    w: 11,
    h: 0.6,
    fontSize: 16,
    color: 'CBD5E1',
  });
  slide.addText(`${BRAND.supportEmail}  ·  ${BRAND.phone}`, {
    x: 0.7,
    y: 4.2,
    w: 11,
    h: 0.5,
    fontSize: 14,
    color: AMBER,
  });
  footer(slide);

  await pptx.writeFile({ fileName: outFile });
  fs.copyFileSync(outFile, path.join(publicDir, 'FleetCo-Smartphone-Telematics-Demo.pptx'));
  try {
    fs.copyFileSync(outFile, path.join(os.homedir(), 'Downloads', 'FleetCo-Smartphone-Telematics-Demo.pptx'));
  } catch { /* optional */ }

  console.log(`Wrote ${outFile} (${slideNum} slides)`);
  console.log(`Copied to ${publicDir}`);

  const auditScript = path.join(__dirname, 'audit-pptx-content.mjs');
  execSync(`node "${auditScript}" "${outFile}" --min-slides=50`, { stdio: 'inherit' });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
