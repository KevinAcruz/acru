"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useTelemetry } from "@/hooks/useTelemetry";
import { LightRays } from "@/components/ui/light-rays";

type ViewMode = "home" | "projects" | "certifications";
type Locale = "en" | "es";

type ProjectItem = {
  period: string;
  title: string;
  summary: string;
  stack: string;
  details: string;
  highlights: string[];
  image?: string;
};

type CertificationItem = {
  year: string;
  title: string;
  issuer: string;
  note: string;
  details: string;
  highlights: string[];
  image?: string;
};

type DetailItem =
  | {
      kind: "project";
      period: string;
      title: string;
      subtitle: string;
      details: string;
      highlights: string[];
      image?: string;
    }
  | {
      kind: "certification";
      period: string;
      title: string;
      subtitle: string;
      details: string;
      highlights: string[];
      image?: string;
    };

type FeatureItem = {
  title: string;
  description: string;
};

type MapPoint = { x: number; y: number };

type MapSignal = {
  code: string;
  label: string;
  count: number;
  lastSeen: number;
  x: number;
  y: number;
};

type WorldFeatureRaw = {
  iso2: string;
  centroid: [number, number] | null;
  geometry: {
    type: "Polygon" | "MultiPolygon";
    coordinates: number[][][] | number[][][][];
  };
};

type WorldShape = {
  iso2: string;
  paths: string[];
};

type WorldMapData = {
  shapes: WorldShape[];
  centroidByIso: Record<string, MapPoint>;
};

const ACTIVE_PULSE_MS = 20_000;
const MAP_WIDTH = 100;
const MAP_HEIGHT = 55;

const PROJECTS: Record<Locale, ProjectItem[]> = {
  en: [
    {
      period: "2026",
      title: "Remote Server Manager",
      summary:
        "A remote control panel for managing server processes with clear state checks and safe start/stop actions.",
      stack: "Next.js, TypeScript, Redis (planned)",
      details:
        "Designed a backend-focused control panel to monitor and manage remote services. The system separates command execution from status reporting to reduce operational mistakes and improve reliability.",
      highlights: [
        "Remote start/stop with state validation",
        "Clear separation between command and telemetry layers",
        "Designed with operational safety in mind",
      ],
      image: "/acru.png",
    },
    {
      period: "2025",
      title: "PRDX Amp",
      summary:
        "An audio simulation tool built with a clear signal flow and real-time processing for practical tone testing.",
      stack: "C++, DSP Concepts",
      details:
        "Built an amp simulation focused on structured signal routing and realistic tone behavior. The architecture keeps each processing stage isolated to make testing and adjustments predictable.",
      highlights: [
        "Modular signal-chain design",
        "Repeatable parameter testing workflow",
        "Real-time audio processing with attention to latency",
      ],
      image: "/acru.png",
    },
    {
      period: "2025",
      title: "Networking Labs",
      summary:
        "Hands-on networking exercises focused on routing, subnetting, and structured troubleshooting.",
      stack: "Linux, TCP/IP, Wireshark",
      details:
        "A collection of practical labs designed to improve packet-level analysis and network diagnostics. Emphasis on understanding traffic flow, isolating faults, and validating connectivity under real conditions.",
      highlights: [
        "Packet inspection and traffic analysis with Wireshark",
        "Subnet planning and routing exercises",
        "Structured troubleshooting methodology",
      ],
      image: "/acru.png",
    },
  ],

  es: [
    {
      period: "2026",
      title: "Gestor de Servidores Remotos",
      summary:
        "Control y monitoreo de servidores remotos con acciones de encendido/apagado y validaciones de estado.",
      stack: "Por Definir",
      details:
        "Panel de control enfocado en operaciones seguras para gestionar servicios remotos con separacion clara entre comandos y telemetria.",
      highlights: [
        "Acciones remotas con validacion de estado",
        "Separacion entre ejecucion de comandos y monitoreo",
        "Enfoque en seguridad operativa",
      ],
      image: "/acru.png",
    },
    {
      period: "2025",
      title: "PRDX Amp",
      summary:
        "Simulador de audio con flujo de senal claro y procesamiento en tiempo real.",
      stack: "C++, Conceptos DSP",
      details:
        "Proyecto enfocado en arquitectura modular de cadena de senal y pruebas de tono repetibles con baja latencia.",
      highlights: [
        "Diseno modular de cadena de senal",
        "Flujo estructurado para pruebas de parametros",
        "Procesamiento de audio en tiempo real",
      ],
      image: "/acru.png",
    },
    {
      period: "2025",
      title: "Laboratorios de Redes",
      summary:
        "Laboratorios practicos enfocados en ruteo, subneteo y diagnostico estructurado.",
      stack: "Linux, TCP/IP, Wireshark",
      details:
        "Ejercicios enfocados en analisis de trafico, validacion de conectividad y aislamiento de fallas en entornos controlados.",
      highlights: [
        "Analisis de paquetes con Wireshark",
        "Planificacion de subredes y rutas",
        "Metodologia estructurada de troubleshooting",
      ],
      image: "/acru.png",
    },
  ],
};

const CERTIFICATIONS: Record<Locale, CertificationItem[]> = {
  en: [
    {
      year: "2026",
      title: "Professional Certifications (In Progress)",
      issuer: "Planned",
      note: "Actively preparing for networking and infrastructure-focused certifications.",
      details:
        "Currently building foundational knowledge in networking, Linux systems, and cloud infrastructure through structured study and hands-on labs.",
      highlights: [
        "Networking fundamentals and troubleshooting",
        "Linux system administration practice",
        "Cloud infrastructure basics",
      ],
      image: "/acru.png",
    },
    {
      year: "2025",
      title: "Self-Directed Infrastructure Study",
      issuer: "Independent Learning",
      note: "Ongoing lab-based learning focused on backend systems and reliability.",
      details:
        "Developing practical skills through lab work, system setup, and backend-focused experimentation aligned with long-term engineering goals.",
      highlights: [
        "Server configuration and diagnostics",
        "Structured troubleshooting workflows",
        "Operational reliability habits",
      ],
      image: "/acru.png",
    },
  ],
  es: [
    {
      year: "2026",
      title: "Certificaciones Profesionales (En Progreso)",
      issuer: "Planificado",
      note: "Preparacion activa para certificaciones enfocadas en redes e infraestructura.",
      details:
        "Construyendo bases solidas en redes, sistemas Linux e infraestructura cloud mediante estudio estructurado y laboratorios practicos.",
      highlights: [
        "Fundamentos de redes y troubleshooting",
        "Practica en administracion de sistemas Linux",
        "Conceptos basicos de infraestructura cloud",
      ],
      image: "/acru.png",
    },
    {
      year: "2025",
      title: "Estudio Autodidacta en Infraestructura",
      issuer: "Aprendizaje Independiente",
      note: "Aprendizaje continuo basado en laboratorios enfocado en sistemas backend y confiabilidad.",
      details:
        "Desarrollo de habilidades practicas mediante configuracion de sistemas, diagnostico y experimentacion alineada con metas profesionales.",
      highlights: [
        "Configuracion y diagnostico de servidores",
        "Metodologia estructurada de troubleshooting",
        "Habitos de confiabilidad operativa",
      ],
      image: "/acru.png",
    },
  ],
};

const FEATURE_ITEMS: Record<Locale, FeatureItem[]> = {
  en: [
    {
      title: "Heartbeat Telemetry",
      description: "Client heartbeat every 15s with session TTL in Upstash Redis.",
    },
    {
      title: "Live Summary Polling",
      description: "UI refreshes active users and recent pings every 5 seconds.",
    },
    {
      title: "Abuse Controls",
      description: "Session/IP rate limits and known-bot filtering at telemetry endpoints.",
    },
    {
      title: "Privacy",
      description: "Approximate region only, no IP storage",
    },
  ],
  es: [
    {
      title: "Telemetria de Heartbeat",
      description: "Heartbeat del cliente cada 15s con TTL de sesion en Upstash Redis.",
    },
    {
      title: "Resumen en Vivo",
      description: "La UI actualiza usuarios activos y pings recientes cada 5 segundos.",
    },
    {
      title: "Controles de Abuso",
      description: "Rate limits por sesion/IP y filtro de bots conocidos en endpoints de telemetria.",
    },
    {
      title: "Privacidad",
      description: "region aproximada solamente, sin almacenamiento de IP",
    },
  ],
};

const UI_TEXT = {
  en: {
    portfolio: "About",
    role: "Computer Science student at UNCC focused on backend systems and practical infrastructure",
    intro:
      "I build reliable tools and backend systems with an emphasis on clarity, structure, and real-world usefulness.",
    basedIn: "Based in",
    city: "Charlotte, NC",
    siteFeatures: "Site Features",
    telemetryTitle: "Live Telemetry",
    telemetryBody:
      "This site tracks active sessions using Upstash Redis with TTL-based heartbeats and summarizes real-time traffic for this dashboard.",
    activeUsers: "Active Users",
    recentPings: "Recent Activity",
    mapTitle: "Live Visitor Map",
    mapHint: "drag + scroll",
    projects: "Projects",
    projectTimeline: "Project Timeline",
    certifications: "Certifications",
    learningTimeline: "Learning Timeline",
    viewDetails: "View Details",
    detailPanelTitle: "Project Details",
    highlights: "Key Points",
    close: "Close",
  },
  es: {
    portfolio: "Sobre Mi",
    role: "Estudiante de Ciencias de la Computacion en UNCC con enfoque en sistemas backend e infraestructura practica",
    intro:
      "Construyo herramientas confiables y sistemas backend con enfasis en claridad, estructura y utilidad real.",
    basedIn: "Ubicado en",
    city: "Charlotte, NC",
    siteFeatures: "Funciones del Sitio",
    telemetryTitle: "Telemetria en Vivo",
    telemetryBody:
      "Este sitio registra sesiones activas usando Upstash Redis con heartbeats basados en TTL y resume el trafico en tiempo real para este panel.",
    activeUsers: "Usuarios Activos",
    recentPings: "Actividad Reciente",
    mapTitle: "Mapa de Visitantes en Vivo",
    mapHint: "arrastrar + rueda",
    projects: "Proyectos",
    projectTimeline: "Linea de Tiempo de Proyectos",
    certifications: "Certificaciones",
    learningTimeline: "Linea de Aprendizaje",
    viewDetails: "Ver Detalles",
    detailPanelTitle: "Detalles del Proyecto",
    highlights: "Puntos Clave",
    close: "Cerrar",
  }
} as const;

const DEFAULT_POINT: MapPoint = { x: 50, y: 28 };

const enterTransition = { duration: 0.35, ease: "easeOut" as const };
const SLIDE_ORDER: ViewMode[] = ["home", "certifications", "projects"];

const US_REGION_ALIASES: Record<string, string> = {
  "NORTH CAROLINA": "NC",
  NC: "NC",
};

const US_STATE_POINTS: Record<string, MapPoint> = {
  NC: lonLatToPoint(-79.0193, 35.7596),
};

function lonLatToPoint(lon: number, lat: number): MapPoint {
  return {
    x: ((lon + 180) / 360) * MAP_WIDTH,
    y: ((90 - lat) / 180) * MAP_HEIGHT,
  };
}

function resolvePingPoint(countryCode: string, regionLabel: string, worldData: WorldMapData): MapPoint {
  const country = countryCode.toUpperCase();

  if (country === "US") {
    const normalizedRegion = regionLabel.trim().toUpperCase();
    const stateCode = US_REGION_ALIASES[normalizedRegion] ?? normalizedRegion;
    const statePoint = US_STATE_POINTS[stateCode];
    if (statePoint) {
      return statePoint;
    }
  }

  return worldData.centroidByIso[country] ?? DEFAULT_POINT;
}

function ringToPath(ring: number[][]): string {
  if (!ring.length) {
    return "";
  }

  const [firstLon, firstLat] = ring[0];
  const first = lonLatToPoint(firstLon, firstLat);
  let path = `M${first.x.toFixed(2)} ${first.y.toFixed(2)}`;

  for (let index = 1; index < ring.length; index += 1) {
    const [lon, lat] = ring[index];
    const point = lonLatToPoint(lon, lat);
    path += ` L${point.x.toFixed(2)} ${point.y.toFixed(2)}`;
  }

  return `${path} Z`;
}

function buildWorldMap(rawFeatures: WorldFeatureRaw[]): WorldMapData {
  const shapes: WorldShape[] = [];
  const centroidByIso: Record<string, MapPoint> = {};

  for (const feature of rawFeatures) {
    const iso2 = feature.iso2?.toUpperCase();
    if (!iso2) {
      continue;
    }

    const paths: string[] = [];

    if (feature.geometry.type === "Polygon") {
      for (const ring of feature.geometry.coordinates as number[][][]) {
        const path = ringToPath(ring);
        if (path) {
          paths.push(path);
        }
      }
    } else {
      for (const polygon of feature.geometry.coordinates as number[][][][]) {
        for (const ring of polygon) {
          const path = ringToPath(ring);
          if (path) {
            paths.push(path);
          }
        }
      }
    }

    if (paths.length) {
      shapes.push({ iso2, paths });
    }

    if (feature.centroid) {
      centroidByIso[iso2] = lonLatToPoint(feature.centroid[0], feature.centroid[1]);
    }
  }

  return { shapes, centroidByIso };
}

function TopNav({
  view,
  onChange,
}: {
  view: ViewMode;
  onChange: (view: ViewMode) => void;
}) {
  return (
    <header className="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center px-5 md:px-8">
      <motion.nav
        initial={{ y: -8, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={enterTransition}
        className="pointer-events-auto flex items-center gap-2 rounded-full border border-[#f06a6a]/30 bg-[#1a1214]/70 p-1.5 backdrop-blur-sm"
      >
        <IconButton active={view === "home"} label="Home" onClick={() => onChange("home")}> 
          <path d="M3 10.5 12 3l9 7.5" />
          <path d="M6 9.8V21h12V9.8" />
        </IconButton>
        <IconButton active={view === "certifications"} label="Certifications" onClick={() => onChange("certifications")}>
          <path d="M12 4 4 7.5 12 11l8-3.5Z" />
          <path d="M6.5 10.2V14.5c0 1.4 2.4 2.5 5.5 2.5s5.5-1.1 5.5-2.5v-4.3" />
        </IconButton>
        <IconButton active={view === "projects"} label="Telemetry" onClick={() => onChange("projects")}>
          <path d="M4 18h16" />
          <path d="M5 12h2l2-3 3 6 3-4 2 3h2" />
          <path d="M5 6h14" />
        </IconButton>
      </motion.nav>
    </header>
  );
}

function IconButton({
  active,
  label,
  onClick,
  children,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      type="button"
      onClick={onClick}
      aria-label={label}
      className={[
        "flex h-10 w-10 items-center justify-center rounded-full border transition",
        active
          ? "border-[#f06a6a]/70 bg-[#d64a4a]/22 text-white"
          : "border-[#f06a6a]/25 bg-transparent text-white/80 hover:text-white",
      ].join(" ")}
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-[2]">
        {children}
      </svg>
    </motion.button>
  );
}

function HeroCard({ locale }: { locale: Locale }) {
  const t = UI_TEXT[locale];
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={enterTransition}
      className="rounded-2xl border border-[#f06a6a]/20 bg-[linear-gradient(160deg,#171318,#130f14)] p-8 shadow-[0_20px_40px_rgba(0,0,0,0.38)] md:p-12"
    >
      <p className="text-xs uppercase tracking-[0.2em] text-[#f2b4b4]">{t.portfolio}</p>
      <div className="mt-3 h-px w-28 bg-gradient-to-r from-[#f06a6a]/70 to-transparent" />
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={`hero-${locale}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
        >
          <h1 className="mt-3 text-4xl font-semibold leading-tight md:text-6xl">Kevin A. Cruz</h1>
          <p className="mt-3 text-base text-white/92">{t.city}</p>
          <p className="mt-3 inline-flex rounded-full border border-[#f06a6a]/30 bg-[#2a1518]/70 px-3 py-1 text-sm text-white/90 md:text-base">
            {t.role}
          </p>
          <p className="mt-6 max-w-2xl text-white/70">{t.intro}</p>
          <p className="mt-4 text-sm text-white/70">
            {t.basedIn}: <span className="text-white/92">{t.city}</span>
          </p>
        </motion.div>
      </AnimatePresence>
    </motion.section>
  );
}

function SiteFeatures({
  activeUsers,
  recentPingsCount,
  error,
  mapSignals,
  snapshotTimestamp,
  worldShapes,
  locale,
}: {
  activeUsers: number;
  recentPingsCount: number;
  error: string | null;
  mapSignals: MapSignal[];
  snapshotTimestamp: number;
  worldShapes: WorldShape[];
  locale: Locale;
}) {
  const t = UI_TEXT[locale];
  const featureItems = FEATURE_ITEMS[locale];
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...enterTransition, delay: 0.06 }}
      className="rounded-2xl border border-[#f06a6a]/20 bg-[linear-gradient(165deg,#171318,#130f14)] p-6 shadow-[0_20px_40px_rgba(0,0,0,0.35)] md:p-8"
    >
      <p className="text-xs uppercase tracking-[0.2em] text-[#f2b4b4]">{t.siteFeatures}</p>
      <h2 className="mt-2 text-2xl font-semibold md:text-3xl">{t.telemetryTitle}</h2>
      <div className="mt-3 h-px w-32 bg-gradient-to-r from-[#f06a6a]/65 to-transparent" />

      <div className="mt-5 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <motion.article whileHover={{ y: -2 }} className="rounded-xl border border-[#f06a6a]/15 bg-[#120f14] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
          <p className="text-sm text-white/70">
            {t.telemetryBody}
          </p>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <MetricCard label={t.activeUsers} value={activeUsers} />
            <MetricCard label={t.recentPings} value={recentPingsCount} />
          </div>

          <ul className="mt-4 space-y-2 text-sm text-white/70">
            {featureItems.map((item) => (
              <li key={item.title} className="rounded-lg border border-[#f06a6a]/12 bg-[#110d12] px-3 py-2">
                <p className="text-[11px] uppercase tracking-[0.14em] text-[#f2b4b4]">{item.title}</p>
                <p className="mt-1">{item.description}</p>
              </li>
            ))}
          </ul>

          {error ? <p className="mt-3 text-sm text-amber-300">{error}</p> : null}
        </motion.article>

        <LiveMapPanel
          mapSignals={mapSignals}
          snapshotTimestamp={snapshotTimestamp}
          worldShapes={worldShapes}
          locale={locale}
        />
      </div>
    </motion.section>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-[#f06a6a]/16 bg-[#110d12] p-3">
      <p className="text-[11px] uppercase tracking-[0.14em] text-[#f2b4b4]">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function LiveMapPanel({
  mapSignals,
  snapshotTimestamp,
  worldShapes,
  locale,
}: {
  mapSignals: MapSignal[];
  snapshotTimestamp: number;
  worldShapes: WorldShape[];
  locale: Locale;
}) {
  const t = UI_TEXT[locale];
  const [pan, setPan] = useState<MapPoint>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const dragRef = useRef<{ active: boolean; x: number; y: number }>({ active: false, x: 0, y: 0 });

  const mapCenterX = MAP_WIDTH / 2;
  const mapCenterY = MAP_HEIGHT / 2;

  const clampPan = (nextPan: MapPoint, nextZoom: number): MapPoint => {
    const maxX = ((MAP_WIDTH * nextZoom - MAP_WIDTH) / 2) + 10;
    const maxY = ((MAP_HEIGHT * nextZoom - MAP_HEIGHT) / 2) + 6;
    return {
      x: Math.max(-maxX, Math.min(maxX, nextPan.x)),
      y: Math.max(-maxY, Math.min(maxY, nextPan.y)),
    };
  };

  const onPointerDown = (event: React.PointerEvent<SVGSVGElement>) => {
    dragRef.current = { active: true, x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: React.PointerEvent<SVGSVGElement>) => {
    if (!dragRef.current.active) {
      return;
    }

    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) {
      return;
    }

    const dxPx = event.clientX - dragRef.current.x;
    const dyPx = event.clientY - dragRef.current.y;
    const dx = dxPx * (MAP_WIDTH / rect.width);
    const dy = dyPx * (MAP_HEIGHT / rect.height);
    dragRef.current = { active: true, x: event.clientX, y: event.clientY };

    setPan((previous) => clampPan({ x: previous.x + dx, y: previous.y + dy }, zoom));
  };

  const onPointerUp = () => {
    dragRef.current.active = false;
  };

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) {
      return;
    }

    const nativeWheelHandler = (event: WheelEvent) => {
      event.preventDefault();
      const rect = svgRef.current?.getBoundingClientRect();
      if (!rect) {
        return;
      }

      const cursorX = ((event.clientX - rect.left) / rect.width) * MAP_WIDTH;
      const cursorY = ((event.clientY - rect.top) / rect.height) * MAP_HEIGHT;
      const direction = event.deltaY > 0 ? -1 : 1;
      const nextZoom = Math.max(1, Math.min(2.4, zoom + direction * 0.08));
      if (nextZoom === zoom) {
        return;
      }

      const worldXBefore = ((cursorX - pan.x - mapCenterX) / zoom) + mapCenterX;
      const worldYBefore = ((cursorY - pan.y - mapCenterY) / zoom) + mapCenterY;

      const nextPan = {
        x: cursorX - (worldXBefore - mapCenterX) * nextZoom - mapCenterX,
        y: cursorY - (worldYBefore - mapCenterY) * nextZoom - mapCenterY,
      };

      setZoom(nextZoom);
      setPan(clampPan(nextPan, nextZoom));
    };

    svg.addEventListener("wheel", nativeWheelHandler, { passive: false });
    return () => {
      svg.removeEventListener("wheel", nativeWheelHandler);
    };
  }, [zoom, pan.x, pan.y, mapCenterX, mapCenterY]);

  const linePairs: Array<{ from: MapSignal; to: MapSignal }> = [];
  for (let index = 0; index < mapSignals.length - 1; index += 1) {
    linePairs.push({ from: mapSignals[index], to: mapSignals[index + 1] });
  }

  const toArcPath = (from: MapSignal, to: MapSignal): string => {
    const midX = (from.x + to.x) / 2;
    const midY = (from.y + to.y) / 2;
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const distance = Math.sqrt(dx * dx + dy * dy) || 1;
    const normalX = -dy / distance;
    const normalY = dx / distance;
    const curve = Math.min(6, distance * 0.28);
    const controlX = midX + normalX * curve;
    const controlY = midY + normalY * curve;
    return `M ${from.x.toFixed(2)} ${from.y.toFixed(2)} Q ${controlX.toFixed(2)} ${controlY.toFixed(2)} ${to.x.toFixed(
      2,
    )} ${to.y.toFixed(2)}`;
  };

  return (
    <motion.article className="rounded-xl border border-[#f06a6a]/15 bg-[#120f14] p-4">
      <div className="mb-3 flex items-center justify-between text-[11px] uppercase tracking-[0.14em] text-[#f2b4b4]">
        <p>{t.mapTitle}</p>
        <div className="flex items-center gap-2 text-white/40">
          <p>{t.mapHint}</p>
          <button
            type="button"
            onClick={() => {
              const nextZoom = Math.max(1, zoom - 0.16);
              setZoom(nextZoom);
              setPan((previous) => clampPan(previous, nextZoom));
            }}
            className="rounded border border-[#f06a6a]/25 px-1.5 py-0.5 text-xs text-white/70 hover:text-white"
            aria-label="Zoom out"
          >
            -
          </button>
          <button
            type="button"
            onClick={() => {
              const nextZoom = Math.min(2.4, zoom + 0.16);
              setZoom(nextZoom);
              setPan((previous) => clampPan(previous, nextZoom));
            }}
            className="rounded border border-[#f06a6a]/25 px-1.5 py-0.5 text-xs text-white/70 hover:text-white"
            aria-label="Zoom in"
          >
            +
          </button>
          <button
            type="button"
            onClick={() => {
              setZoom(1);
              setPan({ x: 0, y: 0 });
            }}
            className="rounded border border-[#f06a6a]/25 px-1.5 py-0.5 text-[10px] text-white/70 hover:text-white"
            aria-label="Reset map view"
          >
            reset
          </button>
        </div>
      </div>

      <div className="relative h-56 rounded-lg border border-[#f06a6a]/14 bg-[#110d12]">
        <div
          className="h-full w-full"
          style={{
            WebkitMaskImage:
              "linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%), linear-gradient(to bottom, transparent 0%, black 8%, black 92%, transparent 100%)",
            maskImage:
              "linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%), linear-gradient(to bottom, transparent 0%, black 8%, black 92%, transparent 100%)",
            WebkitMaskComposite: "source-in",
            maskComposite: "intersect",
          }}
        >
          <svg
            ref={svgRef}
            viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
            className="h-full w-full cursor-grab active:cursor-grabbing"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
          >
            <g
              transform={[
                `translate(${pan.x.toFixed(2)} ${pan.y.toFixed(2)})`,
                `translate(${mapCenterX.toFixed(2)} ${mapCenterY.toFixed(2)})`,
                `scale(${zoom.toFixed(2)})`,
                `translate(${-mapCenterX.toFixed(2)} ${-mapCenterY.toFixed(2)})`,
              ].join(" ")}
            >
              <g fill="#1b1419" stroke="#4f3940" strokeWidth="0.15">
                {worldShapes.map((shape) =>
                  shape.paths.map((path, pathIndex) => (
                    <path key={`${shape.iso2}-${pathIndex}`} d={path} />
                  )),
                )}
              </g>

              {linePairs.map((pair, index) => (
                <path
                  key={`${pair.from.code}-${pair.to.code}-${index}`}
                  d={toArcPath(pair.from, pair.to)}
                  fill="none"
                  stroke="rgba(237,106,106,0.32)"
                  strokeWidth="0.28"
                  strokeDasharray="1.2 1.2"
                >
                  <animate attributeName="stroke-dashoffset" values="0;8" dur="2.4s" repeatCount="indefinite" />
                </path>
              ))}

              {mapSignals.map((region) => {
                const isActive = snapshotTimestamp - region.lastSeen <= ACTIVE_PULSE_MS;
                return (
                  <circle
                    key={region.code}
                    cx={region.x}
                    cy={region.y}
                    r={isActive ? 1.5 : 1.05}
                    fill="#f06a6a"
                    opacity={isActive ? 0.95 : 0.65}
                  >
                    {isActive ? (
                      <animate attributeName="r" values="1.1;2.4;1.1" dur="2s" repeatCount="indefinite" />
                    ) : null}
                  </circle>
                );
              })}
            </g>
          </svg>
        </div>
        <div className="pointer-events-none absolute inset-0 rounded-lg shadow-[inset_0_0_22px_rgba(9,12,16,0.9)]" />
      </div>

      <ul className="mt-3 space-y-1 text-xs text-white/65">
        {(mapSignals.length ? mapSignals : [{ code: "UN", label: "No recent pings", count: 0 }]).map((region) => (
          <li key={region.code} className="flex items-center justify-between">
            <span className="truncate pr-3">{region.label}</span>
            <span>{region.count}</span>
          </li>
        ))}
      </ul>
    </motion.article>
  );
}

function ProjectsTimeline({
  locale,
  onSelect,
}: {
  locale: Locale;
  onSelect: (item: DetailItem) => void;
}) {
  const t = UI_TEXT[locale];
  const projects = PROJECTS[locale];
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={enterTransition}
      className="rounded-2xl border border-[#f06a6a]/20 bg-[linear-gradient(165deg,#171318,#130f14)] p-7 shadow-[0_20px_40px_rgba(0,0,0,0.35)] md:p-10"
    >
      <p className="text-xs uppercase tracking-[0.2em] text-[#f2b4b4]">{t.projects}</p>
      <h2 className="mt-2 text-3xl font-semibold md:text-4xl">{t.projectTimeline}</h2>
      <div className="mt-3 h-px w-32 bg-gradient-to-r from-[#f06a6a]/65 to-transparent" />

      <div className="relative mt-8 pl-6">
        <motion.div
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="absolute left-[7px] top-1 h-[calc(100%-0.5rem)] w-px origin-top bg-white/20"
        />

        <ul className="space-y-6">
          {projects.map((project, index) => (
            <motion.li
              key={`${project.period}-${project.title}`}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.28, delay: 0.06 * index }}
              className="relative"
            >
              <motion.span
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2.4, repeat: Infinity, delay: 0.2 * index }}
                className="absolute -left-6 top-1.5 h-3.5 w-3.5 rounded-full border border-[#f06a6a]/35 bg-[#e86b6b]"
              />
              <motion.button
                type="button"
                onClick={() =>
                  onSelect({
                    kind: "project",
                    period: project.period,
                    title: project.title,
                    subtitle: project.stack,
                    details: project.details,
                    highlights: project.highlights,
                    image: project.image,
                  })
                }
                whileHover={{ y: -2 }}
                className="group w-full rounded-xl border border-[#f06a6a]/15 bg-[#120f14] p-4 text-left md:p-5"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-medium uppercase tracking-[0.12em] text-white/55">{project.period}</p>
                  <p className="text-[11px] uppercase tracking-[0.12em] text-white/40 transition group-hover:text-[#f3b4b4]">
                    {t.viewDetails}
                  </p>
                </div>
                <h3 className="mt-1.5 text-xl font-semibold">{project.title}</h3>
                <p className="mt-2 text-white/70">{project.summary}</p>
                <p className="mt-3 text-sm text-white/55">{project.stack}</p>
              </motion.button>
            </motion.li>
          ))}
        </ul>
      </div>
    </motion.section>
  );
}

function CertificationsTimeline({
  locale,
  onSelect,
}: {
  locale: Locale;
  onSelect: (item: DetailItem) => void;
}) {
  const t = UI_TEXT[locale];
  const certifications = CERTIFICATIONS[locale];
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={enterTransition}
      className="rounded-2xl border border-[#f06a6a]/20 bg-[linear-gradient(165deg,#171318,#130f14)] p-7 shadow-[0_20px_40px_rgba(0,0,0,0.35)] md:p-10"
    >
      <p className="text-xs uppercase tracking-[0.2em] text-[#f2b4b4]">{t.certifications}</p>
      <h2 className="mt-2 text-3xl font-semibold md:text-4xl">{t.learningTimeline}</h2>
      <div className="mt-3 h-px w-32 bg-gradient-to-r from-[#f06a6a]/65 to-transparent" />

      <div className="relative mt-8 pl-6">
        <motion.div
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="absolute left-[7px] top-1 h-[calc(100%-0.5rem)] w-px origin-top bg-white/20"
        />

        <ul className="space-y-6">
          {certifications.map((item, index) => (
            <motion.li
              key={`${item.year}-${item.title}`}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.28, delay: 0.06 * index }}
              className="relative"
            >
              <motion.span
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2.6, repeat: Infinity, delay: 0.2 * index }}
                className="absolute -left-6 top-1.5 h-3.5 w-3.5 rounded-full border border-[#f06a6a]/35 bg-[#e86b6b]"
              />
              <motion.button
                type="button"
                onClick={() =>
                  onSelect({
                    kind: "certification",
                    period: item.year,
                    title: item.title,
                    subtitle: item.issuer,
                    details: item.details,
                    highlights: item.highlights,
                    image: item.image,
                  })
                }
                whileHover={{ y: -2 }}
                className="group w-full rounded-xl border border-[#f06a6a]/15 bg-[#120f14] p-4 text-left md:p-5"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-medium uppercase tracking-[0.12em] text-white/55">{item.year}</p>
                  <p className="text-[11px] uppercase tracking-[0.12em] text-white/40 transition group-hover:text-[#f3b4b4]">
                    {t.viewDetails}
                  </p>
                </div>
                <h3 className="mt-1.5 text-xl font-semibold">{item.title}</h3>
                <p className="mt-1 text-sm text-white/55">{item.issuer}</p>
                <p className="mt-2 text-white/70">{item.note}</p>
              </motion.button>
            </motion.li>
          ))}
        </ul>
      </div>
    </motion.section>
  );
}

function DetailOverlay({
  locale,
  item,
  onClose,
}: {
  locale: Locale;
  item: DetailItem | null;
  onClose: () => void;
}) {
  const t = UI_TEXT[locale];
  return (
    <AnimatePresence>
      {item ? (
        <motion.div
          key={`${item.kind}-${item.title}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]"
          onClick={onClose}
        >
          <motion.section
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.26, ease: "easeOut" }}
            className="w-full max-w-4xl overflow-hidden rounded-2xl border border-[#f06a6a]/22 bg-[#141015] shadow-[0_30px_60px_rgba(0,0,0,0.45)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#f06a6a]/18 bg-[#1d1318] px-5 py-3">
              <p className="text-xs uppercase tracking-[0.14em] text-[#f2b4b4]">{t.detailPanelTitle}</p>
              <button
                type="button"
                onClick={onClose}
                className="rounded border border-[#f06a6a]/28 px-2 py-1 text-xs text-white/80 hover:text-white"
              >
                {t.close}
              </button>
            </div>

            <div className="grid gap-0 md:grid-cols-[0.95fr_1.05fr]">
              <div className="relative min-h-56 border-b border-[#f06a6a]/15 bg-[#0f0b10] md:border-b-0 md:border-r">
                {item.image ? (
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    className="object-cover opacity-85"
                    sizes="(max-width: 768px) 100vw, 40vw"
                  />
                ) : null}
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(240,106,106,0.16),transparent_60%)]" />
              </div>

              <div className="space-y-4 px-5 py-5 md:px-6 md:py-6">
                <p className="text-xs uppercase tracking-[0.12em] text-white/55">{item.period}</p>
                <h3 className="text-2xl font-semibold">{item.title}</h3>
                <p className="text-sm text-white/65">{item.subtitle}</p>
                <p className="text-white/75">{item.details}</p>
                <div>
                  <p className="text-xs uppercase tracking-[0.12em] text-[#f2b4b4]">{t.highlights}</p>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-white/72">
                    {item.highlights.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </motion.section>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export default function Home() {
  const [view, setView] = useState<ViewMode>("home");
  const [slideDirection, setSlideDirection] = useState(1);
  const [locale, setLocale] = useState<Locale>("en");
  const [selectedDetail, setSelectedDetail] = useState<DetailItem | null>(null);
  const [showLanguageSplash, setShowLanguageSplash] = useState(false);
  const [splashWord, setSplashWord] = useState<"Hola" | "Hello">("Hola");
  const splashTimeoutRef = useRef<number | null>(null);
  const [worldData, setWorldData] = useState<WorldMapData>({ shapes: [], centroidByIso: {} });
  const { summary, error } = useTelemetry();

  useEffect(() => {
    return () => {
      if (splashTimeoutRef.current !== null) {
        window.clearTimeout(splashTimeoutRef.current);
      }
    };
  }, []);

  const toggleLocale = () => {
    const nextLocale: Locale = locale === "en" ? "es" : "en";
    setLocale(nextLocale);
    setSplashWord(nextLocale === "es" ? "Hola" : "Hello");
    setShowLanguageSplash(true);
    if (splashTimeoutRef.current !== null) {
      window.clearTimeout(splashTimeoutRef.current);
    }
    splashTimeoutRef.current = window.setTimeout(() => setShowLanguageSplash(false), 1500);
  };

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const response = await fetch("/world-slim.json", { cache: "force-cache" });
        if (!response.ok || !active) {
          return;
        }

        const payload = (await response.json()) as { features?: WorldFeatureRaw[] };
        const next = buildWorldMap(payload.features ?? []);
        if (active) {
          setWorldData(next);
        }
      } catch {
        if (active) {
          setWorldData({ shapes: [], centroidByIso: {} });
        }
      }
    };

    load();

    return () => {
      active = false;
    };
  }, []);

  const snapshotTimestamp = summary?.updatedAt ? Date.parse(summary.updatedAt) : 0;

  const grouped = new Map<string, MapSignal>();
  for (const ping of summary?.recentPings ?? []) {
    const code = ping.country.toUpperCase();
    const existing = grouped.get(code);

    if (existing) {
      existing.count += 1;
      existing.lastSeen = Math.max(existing.lastSeen, ping.timestamp);
      continue;
    }

    const point =
      typeof ping.longitude === "number" && typeof ping.latitude === "number"
        ? lonLatToPoint(ping.longitude, ping.latitude)
        : resolvePingPoint(code, ping.region, worldData);
    grouped.set(code, {
      code,
      label: `${ping.region} (${code})`,
      count: 1,
      lastSeen: ping.timestamp,
      x: point.x,
      y: point.y,
    });
  }
  const mapSignals = [...grouped.values()].sort((a, b) => b.lastSeen - a.lastSeen);
  const currentSlideIndex = SLIDE_ORDER.indexOf(view);

  const goToSlide = (nextView: ViewMode) => {
    const nextIndex = SLIDE_ORDER.indexOf(nextView);
    if (nextIndex === -1 || nextIndex === currentSlideIndex) {
      return;
    }
    setSlideDirection(nextIndex > currentSlideIndex ? 1 : -1);
    setView(nextView);
  };

  const goStep = (step: 1 | -1) => {
    const nextIndex = (currentSlideIndex + step + SLIDE_ORDER.length) % SLIDE_ORDER.length;
    setSlideDirection(step);
    setView(SLIDE_ORDER[nextIndex]);
  };

  return (
    <div className="min-h-screen bg-[#0d0b0d] text-[#e9edf4]">
      <div className="pointer-events-none fixed inset-0 overflow-hidden opacity-35">
        <LightRays
          count={8}
          color="rgba(227, 88, 88, 0.58)"
          blur={54}
          speed={16}
          length="95vh"
          className="mix-blend-screen"
          style={{ transform: "translateY(-4%)" }}
        />
      </div>

      <TopNav view={view} onChange={goToSlide} />
      <div className="pointer-events-none fixed right-5 top-5 z-[60] md:right-8">
        <button
          type="button"
          onClick={toggleLocale}
          className="pointer-events-auto rounded-full border border-[#f06a6a]/40 bg-[#2a1518]/70 px-3 py-1.5 text-xs font-semibold tracking-[0.08em] text-white/90 hover:text-white"
          aria-label="Toggle language"
        >
          {locale === "en" ? "EN/ES" : "ES/EN"}
        </button>
      </div>
      <AnimatePresence>
        {showLanguageSplash ? (
          <motion.div
            key={`language-splash-${splashWord}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="pointer-events-none fixed inset-0 z-[70] flex items-center justify-center"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.45 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.55 }}
              className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(227,88,88,0.28),rgba(10,7,8,0.75)_62%)]"
            />
            <motion.p
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 0.3, scale: 1.08 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="absolute text-[20vw] font-semibold tracking-tight text-[#f06a6a]/45 blur-[14px]"
            >
              {splashWord}
            </motion.p>
            <motion.p
              initial={{ opacity: 0, y: 24, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.65, ease: "easeOut" }}
              className="relative text-6xl font-semibold tracking-tight text-white md:text-8xl"
            >
              {splashWord}
            </motion.p>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <main className="relative mx-auto w-full max-w-5xl px-5 pb-14 pt-24 md:px-8 md:pt-28">
        <button
          type="button"
          onClick={() => goStep(-1)}
          aria-label="Previous page"
          className="group fixed left-6 top-1/2 z-20 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-[#f06a6a]/28 bg-[#1a1214]/75 text-white/75 backdrop-blur-sm transition hover:text-white md:flex"
        >
          <motion.svg
            viewBox="0 0 24 24"
            className="h-6 w-6 fill-none stroke-current stroke-[2]"
            animate={{ x: [0, -3, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          >
            <path d="M15.5 4.5 8 12l7.5 7.5" />
          </motion.svg>
          <span className="pointer-events-none absolute inset-0 rounded-full ring-0 ring-[#f06a6a]/40 transition group-hover:ring-2" />
        </button>
        <button
          type="button"
          onClick={() => goStep(1)}
          aria-label="Next page"
          className="group fixed right-6 top-1/2 z-20 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-[#f06a6a]/28 bg-[#1a1214]/75 text-white/75 backdrop-blur-sm transition hover:text-white md:flex"
        >
          <motion.svg
            viewBox="0 0 24 24"
            className="h-6 w-6 fill-none stroke-current stroke-[2]"
            animate={{ x: [0, 3, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          >
            <path d="M8.5 4.5 16 12l-7.5 7.5" />
          </motion.svg>
          <span className="pointer-events-none absolute inset-0 rounded-full ring-0 ring-[#f06a6a]/40 transition group-hover:ring-2" />
        </button>
        <AnimatePresence mode="wait" initial={false}>
          {view === "home" ? (
            <motion.div
              key={`home-${locale}`}
              custom={slideDirection}
              initial={{ opacity: 0, x: slideDirection > 0 ? 42 : -42 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: slideDirection > 0 ? -42 : 42 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
            >
              <div className="space-y-6">
                <HeroCard locale={locale} />
                <ProjectsTimeline locale={locale} onSelect={setSelectedDetail} />
              </div>
            </motion.div>
          ) : view === "certifications" ? (
            <motion.div
              key={`certifications-${locale}`}
              custom={slideDirection}
              initial={{ opacity: 0, x: slideDirection > 0 ? 42 : -42 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: slideDirection > 0 ? -42 : 42 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
            >
              <CertificationsTimeline locale={locale} onSelect={setSelectedDetail} />
            </motion.div>
          ) : (
            <motion.div
              key={`telemetry-${locale}`}
              custom={slideDirection}
              initial={{ opacity: 0, x: slideDirection > 0 ? 42 : -42 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: slideDirection > 0 ? -42 : 42 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
            >
              <SiteFeatures
                activeUsers={summary?.activeUsers ?? 0}
                recentPingsCount={summary?.recentPings.length ?? 0}
                error={error}
                mapSignals={mapSignals}
                snapshotTimestamp={snapshotTimestamp}
                worldShapes={worldData.shapes}
                locale={locale}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      <DetailOverlay locale={locale} item={selectedDetail} onClose={() => setSelectedDetail(null)} />
    </div>
  );
}

