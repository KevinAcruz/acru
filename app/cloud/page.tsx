"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
} from "react";

type FsNode =
  | { type: "dir"; children: Record<string, FsNode> }
  | { type: "file"; content: string };

type TerminalLine = {
  id: string;
  kind: "command" | "output" | "error" | "system";
  text: string;
};

const COMMANDS = [
  "help",
  "ls",
  "cd",
  "pwd",
  "cat",
  "whoami",
  "skills",
  "projects",
  "tree",
  "neofetch",
  "about",
  "curl",
  "clear",
  "date",
] as const;

const CURL_ENDPOINTS = ["/api/health", "/api/metrics", "/api/jobs"] as const;

const FILE_SYSTEM: FsNode = {
  type: "dir",
  children: {
    home: {
      type: "dir",
      children: {
        guest: {
          type: "dir",
          children: {
            "README.md": {
              type: "file",
              content: [
                "Welcome to ACRU Cloud Console.",
                "",
                "This is an interactive terminal-style portfolio focused on backend + cloud fundamentals,",
                "built by a CS (Networking) student aiming toward DevOps/SRE over time.",
                "",
                "Try:",
                "  help",
                "  tree",
                "  cd /home/guest/projects && ls",
                "  cd /home/guest/skills && ls",
              ].join("\n"),
            },
            projects: {
              type: "dir",
              children: {
                "amp-sim.md": {
                  type: "file",
                  content: [
                    "Spatial Reverb Amp Simulator",
                    "Stack: C# (WPF) + NAudio (ASIO)",
                    "",
                    "A real-time audio processing application focused on atmospheric, spatial-heavy",
                    "reverb design with emotional depth and weight.",
                    "",
                    "Core Challenges:",
                    "- Managing low-latency audio buffers through ASIO",
                    "- Avoiding clipping while shaping distortion curves",
                    "- Designing DSP algorithms that maintain clarity at high gain",
                    "- Balancing CPU cost vs sound quality",
                    "",
                    "Key Focus:",
                    "- Real-time performance discipline",
                    "- Latency awareness",
                    "- Clean signal routing",
                    "- User-controlled parameter visualization",
                  ].join("\n"),
                },
                "server-manager.md": {
                  type: "file",
                  content: [
                    "Remote Server Manager (In Progress)",
                    "Goal: Secure daemon-based server orchestration for homelab infrastructure.",
                    "",
                    "Concept:",
                    "A lightweight service that runs as a daemon on a home server, allowing",
                    "remote lifecycle control (start/stop/status) of self-hosted services.",
                    "",
                    "Planned Architecture:",
                    "- Background daemon process",
                    "- Authenticated API layer (TBD)",
                    "- Remote access via Cloudflare Tunnel (no exposed public IP)",
                    "- Command execution with strict validation",
                    "",
                    "Primary Focus:",
                    "- Security first: no arbitrary command execution",
                    "- Least privilege process permissions",
                    "- Input validation and request logging",
                    "- Controlled action surface (whitelisted operations only)",
                    "",
                    "Security Direction:",
                    "Starting simple (student-safe) and improving over time:",
                    "- Rotating API keys with expiration (or token-based auth later)",
                    "- Encrypted secret storage on host machine",
                    "- Rate limiting + basic audit logs",
                  ].join("\n"),
                },
              },
            },
            skills: {
              type: "dir",
              children: {
                "backend.txt": {
                  type: "file",
                  content: [
                    "Backend (Student, Internship Ready)",
                    "- Java-first backend foundations: data structures, APIs, clean control flow",
                    "- Next.js API routes: request handling, input validation, predictable responses",
                    "- Data persistence: SQL schema work + Redis basics (caching / fast lookups)",
                    "- Async mindset: jobs/queues concepts (learning + building toward it)",
                    "- Reliability habits: clear error paths, safe defaults, and debugging discipline",
                  ].join("\n"),
                },
                "cloud.txt": {
                  type: "file",
                  content: [
                    "Cloud (Learning Track → DevOps Direction)",
                    "- Building toward a homelab: services, networking, and real deployment practice",
                    "- Secure remote access plan: Cloudflare Tunnel to avoid direct IP exposure",
                    "- Core concepts I'm studying: environments, automation, and service isolation",
                    "- Goal: turn projects into deployable systems with real monitoring + operations",
                  ].join("\n"),
                },
                "ops.txt": {
                  type: "file",
                  content: [
                    "Ops / Reliability (What I Care About)",
                    "- Uptime + safety first: guardrails before convenience",
                    "- Security is a feature: auth, least privilege, and audit-minded actions",
                    "- Observability direction: health endpoints, logs, metrics, latency awareness",
                    "- Rollback mindset: changes should be reversible and diagnosable",
                  ].join("\n"),
                },
              },
            },
            "contact.txt": {
              type: "file",
              content: [
                "Contact",
                "- Portfolio: acru.dev",
                "- Email: kevin@acru.dev",
                "",
                "Focus",
                "- CS (Networking) student targeting backend now, moving toward DevOps/SRE long-term.",
                "- Known for consistency: I show up, learn fast, and aim to be reliable on a team.",
              ].join("\n"),
            },
          },
        },
      },
    },
    etc: {
      type: "dir",
      children: {
        motd: {
          type: "file",
          content: "ACRU CLOUD TERMINAL // interactive portfolio surface",
        },
      },
    },
  },
};

const START_PATH = "/home/guest";
const TERMINAL_ICON_PATH = "/terminal.svg";
const SHUTDOWN_ICON_PATH = "/shutdown.svg";
const FOLDER_ICON_PATH = "/folder-1485.svg";
const SESSION_STORAGE_KEY = "acru-cloud-session-v1";

const clampPathParts = (parts: string[]) => {
  const out: string[] = [];
  for (const part of parts) {
    if (!part || part === ".") continue;
    if (part === "..") {
      out.pop();
      continue;
    }
    out.push(part);
  }
  return out;
};

const pathToParts = (path: string) => clampPathParts(path.split("/").filter(Boolean));

const partsToPath = (parts: string[]) => `/${parts.join("/")}`.replace(/\/+/g, "/");

const resolvePath = (cwd: string, input: string) => {
  if (!input || input === ".") return pathToParts(cwd);
  if (input.startsWith("/")) return clampPathParts(input.split("/").filter(Boolean));
  return clampPathParts([
    ...pathToParts(cwd),
    ...input.split("/").filter(Boolean),
  ]);
};

const getNode = (parts: string[]): FsNode | null => {
  let node: FsNode = FILE_SYSTEM;
  for (const part of parts) {
    if (node.type !== "dir") return null;
    const nextNode: FsNode | undefined = node.children[part];
    if (!nextNode) return null;
    node = nextNode;
  }
  return node;
};

const makePrompt = (cwd: string) => `guest@acru-cloud:${cwd}$`;

const longestCommonPrefix = (values: string[]) => {
  if (!values.length) return "";
  let prefix = values[0];
  for (let i = 1; i < values.length; i += 1) {
    while (!values[i].startsWith(prefix)) {
      prefix = prefix.slice(0, -1);
      if (!prefix) return "";
    }
  }
  return prefix;
};

export default function CloudPage() {
  const router = useRouter();

  const [isBootLoading, setIsBootLoading] = useState(true);
  const [bootProgress, setBootProgress] = useState(0);
  const [bootDone, setBootDone] = useState(false);

  const [cwd, setCwd] = useState(START_PATH);
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [lines, setLines] = useState<TerminalLine[]>([]);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [, setHistoryIndex] = useState<number | null>(null);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const outputRef = useRef<HTMLDivElement | null>(null);
  const windowRef = useRef<HTMLElement | null>(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  const [viewport, setViewport] = useState({ w: 0, h: 0 });
  const [windowPos, setWindowPos] = useState({ x: 80, y: 84 });
  const [isDragging, setIsDragging] = useState(false);
  const [now, setNow] = useState("--:--:--");
  const [isShuttingDown, setIsShuttingDown] = useState(false);

  const [sessionHydrated, setSessionHydrated] = useState(false);
  const [restoredSession, setRestoredSession] = useState(false);

  const pushLine = (kind: TerminalLine["kind"], text: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    setLines((old) => [...old, { id, kind, text }]);
  };

  useEffect(() => {
    const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) {
      setSessionHydrated(true);
      return;
    }

    try {
      const parsed = JSON.parse(raw) as {
        cwd?: string;
        history?: string[];
        windowPos?: { x: number; y: number };
        terminalOpen?: boolean;
        lines?: TerminalLine[];
        input?: string;
      };

      if (typeof parsed.cwd === "string") setCwd(parsed.cwd);
      if (Array.isArray(parsed.history)) setHistory(parsed.history.slice(-120));
      if (
        parsed.windowPos &&
        Number.isFinite(parsed.windowPos.x) &&
        Number.isFinite(parsed.windowPos.y)
      ) {
        setWindowPos({ x: parsed.windowPos.x, y: parsed.windowPos.y });
      }
      if (typeof parsed.terminalOpen === "boolean") setTerminalOpen(parsed.terminalOpen);
      if (Array.isArray(parsed.lines)) setLines(parsed.lines.slice(-260));
      if (typeof parsed.input === "string") setInput(parsed.input);

      setBootDone(true);
      setIsBootLoading(false);
      setRestoredSession(true);
    } catch {
      // Ignore malformed persisted state and start clean.
    } finally {
      setSessionHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!sessionHydrated) return;
    const snapshot = {
      cwd,
      history: history.slice(-120),
      windowPos,
      terminalOpen,
      lines: lines.slice(-260),
      input,
    };
    window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(snapshot));
  }, [cwd, history, windowPos, terminalOpen, lines, input, sessionHydrated]);

  useEffect(() => {
    if (!isBootLoading) return;

    const timer = window.setInterval(() => {
      setBootProgress((prev) => {
        const gain = prev < 28 ? 3 : prev < 68 ? 2 : prev < 92 ? 1.2 : 0.7;
        const next = Math.min(100, prev + gain);
        if (next >= 100) {
          window.clearInterval(timer);
          window.setTimeout(() => setIsBootLoading(false), 360);
        }
        return next;
      });
    }, 90);

    return () => window.clearInterval(timer);
  }, [isBootLoading]);

  useEffect(() => {
    if (restoredSession) return;

    const bootSequence = [
      "Booting ACRU Cloud Runtime...",
      "Loading service registry...",
      "Initializing telemetry buffers...",
      "Mounting interactive portfolio filesystem...",
      "Ready.",
    ];

    let step = 0;
    const timer = window.setInterval(() => {
      if (step >= bootSequence.length) {
        window.clearInterval(timer);
        setBootDone(true);
        pushLine("system", "Type `help` to explore backend/cloud skills.");
        return;
      }
      pushLine("system", bootSequence[step]);
      step += 1;
    }, 280);

    return () => window.clearInterval(timer);
  }, [restoredSession]);

  useEffect(() => {
    outputRef.current?.scrollTo({ top: outputRef.current.scrollHeight });
  }, [lines]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [bootDone]);

  useEffect(() => {
    const sync = () => setViewport({ w: window.innerWidth, h: window.innerHeight });
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, []);

  useEffect(() => {
    setNow(new Date().toLocaleTimeString());
    const timer = window.setInterval(
      () => setNow(new Date().toLocaleTimeString()),
      1000,
    );
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    const onMove = (event: globalThis.MouseEvent) => {
      const box = windowRef.current;
      if (!box) return;
      const width = box.offsetWidth;
      const height = box.offsetHeight;
      const maxX = Math.max(8, viewport.w - width - 8);
      const maxY = Math.max(8, viewport.h - height - 8);
      const nextX = Math.min(maxX, Math.max(8, event.clientX - dragOffsetRef.current.x));
      const nextY = Math.min(maxY, Math.max(8, event.clientY - dragOffsetRef.current.y));
      setWindowPos({ x: nextX, y: nextY });
    };

    const onUp = () => setIsDragging(false);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [isDragging, viewport.w, viewport.h]);

  const prompt = useMemo(() => makePrompt(cwd), [cwd]);
  const isDesktop = viewport.w >= 768;

  const runCommand = (raw: string) => {
    const commandLine = raw.trim();
    pushLine("command", `${prompt} ${commandLine}`);
    if (!commandLine) return;

    setHistory((prev) => [...prev, commandLine]);
    setHistoryIndex(null);

    const [rawCmd, ...rawArgs] = commandLine.split(/\s+/);
    let cmd = rawCmd;
    let args = rawArgs;

    if (cmd === "..") {
      cmd = "cd";
      args = [".."];
    } else if (cmd === "ll") {
      cmd = "ls";
    } else if (cmd === "cls") {
      cmd = "clear";
    }

    const print = (text: string) => {
      for (const row of text.split("\n")) pushLine("output", row);
    };
    const error = (text: string) => pushLine("error", text);

    if (cmd === "help") {
      print(
        [
          "Available commands:",
          "  help                Show this help menu",
          "  ls [path]           List directory contents",
          "  cd <path>           Change directory (supports .. and absolute paths)",
          "  pwd                 Print current directory",
          "  cat <file>          Print file contents",
          "  whoami              Print active profile",
          "  skills              Quick jump to core skill summary",
          "  projects            Quick jump to project summary",
          "  tree                Show a compact project tree",
          "  neofetch            Show profile/system summary",
          "  about               Show portfolio mission",
          "  curl <endpoint>     Query mock backend APIs",
          "                      Endpoints: /api/health /api/metrics /api/jobs",
          "Aliases: ll -> ls, cls -> clear, .. -> cd ..",
          "  clear               Clear terminal output",
          "  date                Print current local datetime",
        ].join("\n"),
      );
      return;
    }

    if (cmd === "clear") {
      setLines([]);
      return;
    }

    if (cmd === "pwd") {
      print(cwd);
      return;
    }

    if (cmd === "whoami") {
      print("guest (cloud/backend portfolio viewer)");
      return;
    }

    if (cmd === "date") {
      print(new Date().toString());
      return;
    }

    if (cmd === "skills") {
      print("Try:\n  cd /home/guest/skills\n  ls\n  cat backend.txt");
      return;
    }

    if (cmd === "projects") {
      print("Try:\n  cd /home/guest/projects\n  ls\n  cat amp-sim.md");
      return;
    }

    if (cmd === "tree") {
      print(
        [
          "/home/guest",
          "├─ README.md",
          "├─ contact.txt",
          "├─ projects",
          "│  ├─ amp-sim.md",
          "│  └─ server-manager.md",
          "└─ skills",
          "   ├─ backend.txt",
          "   ├─ cloud.txt",
          "   └─ ops.txt",
        ].join("\n"),
      );
      return;
    }

    if (cmd === "about") {
      print(
        [
          "ACRU Cloud Surface",
          "Purpose: demonstrate backend/cloud capability through an interactive shell.",
          "Focus: backend fundamentals today, DevOps/SRE direction long-term.",
          "Theme: reliability mindset + learning through building real systems.",
        ].join("\n"),
      );
      return;
    }

    if (cmd === "neofetch") {
      print(
        [
          "guest@acru-cloud",
          "------------------------------",
          "OS: ACRU Linux (Portfolio Build)",
          "Host: cloud.console.acru",
          "Role: CS Student (Networking) → Backend/Cloud Internship Candidate",
          "Stack: Java, C# (WPF), Next.js, SQL, Redis (basics)",
          "Focus: Reliability, Telemetry, Secure Operations",
        ].join("\n"),
      );
      return;
    }

    if (cmd === "curl") {
      const endpoint = args[0];
      if (!endpoint) {
        error("curl: missing endpoint");
        return;
      }

      if (endpoint === "/api/health") {
        const payload = {
          status: "ok",
          timestamp: new Date().toISOString(),
          services: [
            { name: "gateway", status: "healthy", latency_ms: 18 },
            { name: "job-runner", status: "healthy", latency_ms: 42 },
            { name: "telemetry", status: "healthy", latency_ms: 27 },
          ],
          uptime_percent_24h: 99.97,
        };
        print(JSON.stringify(payload, null, 2));
        return;
      }

      if (endpoint === "/api/metrics") {
        const payload = {
          requests_per_min: 318,
          p95_latency_ms: 84,
          error_rate_percent: 0.19,
          active_nodes: 6,
          queue_depth: 12,
        };
        print(JSON.stringify(payload, null, 2));
        return;
      }

      if (endpoint === "/api/jobs") {
        const payload = {
          active: 3,
          queued: 7,
          recent: [
            { id: "job_4812", kind: "deploy", status: "success" },
            { id: "job_4813", kind: "provision", status: "running" },
            { id: "job_4814", kind: "healthcheck", status: "queued" },
          ],
        };
        print(JSON.stringify(payload, null, 2));
        return;
      }

      error(`curl: unknown endpoint '${endpoint}'`);
      return;
    }

    if (cmd === "ls") {
      const targetParts = resolvePath(cwd, args[0] ?? ".");
      const node = getNode(targetParts);
      if (!node) {
        error(`ls: cannot access '${args[0] ?? "."}': No such file or directory`);
        return;
      }
      if (node.type === "file") {
        print(args[0] ?? ".");
        return;
      }
      const names = Object.entries(node.children)
        .map(([name, child]) => (child.type === "dir" ? `${name}/` : name))
        .sort((a, b) => a.localeCompare(b));
      print(names.join("  "));
      return;
    }

    if (cmd === "cd") {
      const target = args[0] ?? "/home/guest";
      const targetParts = resolvePath(cwd, target);
      const node = getNode(targetParts);
      if (!node || node.type !== "dir") {
        error(`cd: ${target}: No such directory`);
        return;
      }
      setCwd(partsToPath(targetParts));
      return;
    }

    if (cmd === "cat") {
      const target = args[0];
      if (!target) {
        error("cat: missing file operand");
        return;
      }
      const targetParts = resolvePath(cwd, target);
      const node = getNode(targetParts);
      if (!node) {
        error(`cat: ${target}: No such file or directory`);
        return;
      }
      if (node.type !== "file") {
        error(`cat: ${target}: Is a directory`);
        return;
      }
      print(node.content);
      return;
    }

    error(`${cmd}: command not found`);
  };

  const onInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      const value = input;
      setInput("");
      runCommand(value);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (!history.length) return;
      setHistoryIndex((prev) => {
        const next = prev === null ? history.length - 1 : Math.max(0, prev - 1);
        setInput(history[next] ?? "");
        return next;
      });
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!history.length) return;
      setHistoryIndex((prev) => {
        if (prev === null) return null;
        const next = prev + 1;
        if (next >= history.length) {
          setInput("");
          return null;
        }
        setInput(history[next] ?? "");
        return next;
      });
      return;
    }

    if (event.key === "Tab") {
      event.preventDefault();
      const raw = input;
      const endsWithSpace = /\s$/.test(raw);
      const trimmed = raw.trim();

      const applyInline = (next: string) => setInput(next);
      const showSuggestions = (items: string[]) => {
        if (!items.length) return;
        pushLine("system", items.join("  "));
      };

      if (!trimmed) {
        showSuggestions([...COMMANDS]);
        return;
      }

      const parts = trimmed.split(/\s+/);
      const cmd = parts[0] ?? "";

      if (parts.length === 1 && !endsWithSpace) {
        const matches = COMMANDS.filter((c) => c.startsWith(cmd));
        if (!matches.length) return;
        if (matches.length === 1) {
          applyInline(`${matches[0]} `);
          return;
        }
        const shared = longestCommonPrefix(matches);
        if (shared.length > cmd.length) {
          applyInline(shared);
          return;
        }
        showSuggestions(matches as unknown as string[]);
        return;
      }

      if (cmd === "curl") {
        const endpointPrefix = endsWithSpace ? "" : parts[parts.length - 1] ?? "";
        const matches = CURL_ENDPOINTS.filter((ep) => ep.startsWith(endpointPrefix));
        if (!matches.length) return;
        if (matches.length === 1) {
          applyInline(`curl ${matches[0]} `);
          return;
        }
        const shared = longestCommonPrefix(matches as unknown as string[]);
        if (shared.length > endpointPrefix.length) {
          applyInline(`curl ${shared}`);
          return;
        }
        showSuggestions(matches as unknown as string[]);
        return;
      }

      if (cmd === "cd" || cmd === "ls" || cmd === "cat") {
        const currentArg = endsWithSpace ? "" : parts[parts.length - 1] ?? "";
        const slashIndex = currentArg.lastIndexOf("/");
        const parentInput = slashIndex === -1 ? "." : currentArg.slice(0, slashIndex + 1);
        const namePrefix =
          slashIndex === -1 ? currentArg : currentArg.slice(slashIndex + 1);

        const parentParts = resolvePath(cwd, parentInput || ".");
        const parentNode = getNode(parentParts);
        if (!parentNode || parentNode.type !== "dir") return;

        const matches = Object.entries(parentNode.children)
          .filter(([name]) => name.startsWith(namePrefix))
          .map(([name, node]) => `${name}${node.type === "dir" ? "/" : ""}`)
          .sort((a, b) => a.localeCompare(b));

        if (!matches.length) return;

        if (matches.length === 1) {
          const rebuilt = `${cmd} ${parentInput === "." ? "" : parentInput}${matches[0]}`;
          applyInline(rebuilt + (matches[0].endsWith("/") ? "" : " "));
          return;
        }

        const shared = longestCommonPrefix(matches);
        if (shared.length > namePrefix.length) {
          applyInline(`${cmd} ${parentInput === "." ? "" : parentInput}${shared}`);
          return;
        }

        showSuggestions(matches);
      }
    }
  };

  const onWindowBarMouseDown = (event: MouseEvent<HTMLDivElement>) => {
    if (!isDesktop) return;
    const box = windowRef.current;
    if (!box) return;
    const rect = box.getBoundingClientRect();
    dragOffsetRef.current = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    setIsDragging(true);
  };

  const handleShutdown = () => {
    if (isShuttingDown) return;
    setIsShuttingDown(true);
    window.setTimeout(() => {
      router.push("/");
    }, 1000);
  };

  const runDesktopCommands = (commands: string[]) => {
    if (!bootDone) return;
    setTerminalOpen(true);
    commands.forEach((cmd, index) => {
      window.setTimeout(() => runCommand(cmd), index * 80);
    });
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#120709] text-[#f2d0d0]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(220,112,112,0.22),transparent_48%),radial-gradient(circle_at_80%_30%,rgba(185,90,122,0.14),transparent_42%),linear-gradient(140deg,#120709_0%,#1d0b10_46%,#2a0f16_100%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(0deg,rgba(255,212,212,0.04)_0px,rgba(255,212,212,0.04)_1px,transparent_2px,transparent_4px)] opacity-35" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_58%,rgba(0,0,0,0.65)_100%)]" />

      <div className="absolute left-0 right-0 top-0 z-20 h-9 border-b border-[#cf6a6a42] bg-[#1a0d10d1] px-3 text-[15px] uppercase tracking-[0.16em] text-[#f1c4c4]">
        <div className="flex h-full items-center justify-between">
          <span>ACRU OS</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setTerminalOpen(true)}
              className="rounded border border-[#cf7b7b5a] bg-[#2a1216cc] p-1 transition hover:bg-[#411920]"
              title="Open Terminal"
              aria-label="Open Terminal"
            >
              <Image
                src={TERMINAL_ICON_PATH}
                alt="Terminal"
                width={16}
                height={16}
                className="h-4 w-4 object-contain brightness-0 invert"
              />
            </button>
            <button
              type="button"
              onClick={handleShutdown}
              className="flex items-center gap-1 rounded border border-[#c58a9a5e] bg-[#34131ebd] px-2 py-0.5 text-[10px] tracking-[0.08em] text-[#f0c5d2] transition hover:bg-[#4a1b2a]"
            >
              <Image
                src={SHUTDOWN_ICON_PATH}
                alt="Shutdown"
                width={12}
                height={12}
                className="h-3 w-3 object-contain brightness-0 invert"
              />
              <span>Shutdown</span>
            </button>
            <span>{now}</span>
          </div>
        </div>
      </div>

      <main className="relative z-10 min-h-screen p-4 pt-14 md:p-6 md:pt-14">
        <div className="fixed left-6 top-16 z-20 grid grid-cols-2 gap-x-4 gap-y-4">
          {[
            {
              label: "Terminal",
              icon: TERMINAL_ICON_PATH,
              commands: [],
              onClick: () => setTerminalOpen(true),
            },
            {
              label: "Projects",
              icon: FOLDER_ICON_PATH,
              commands: ["cd /home/guest/projects", "ls"],
            },
            {
              label: "Skills",
              icon: FOLDER_ICON_PATH,
              commands: ["cd /home/guest/skills", "ls"],
            },
            {
              label: "Health",
              icon: TERMINAL_ICON_PATH,
              commands: ["curl /api/health"],
            },
          ].map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() =>
                item.onClick ? item.onClick() : runDesktopCommands(item.commands)
              }
              className="flex flex-col items-center text-center text-[#efc8c8]"
              title={item.label}
              aria-label={item.label}
            >
              <span className="flex h-12 w-12 items-center justify-center border border-[#cf7b7b5a] bg-[#1f1013e6] p-2 shadow-[0_0_22px_rgba(207,90,90,0.2)] transition hover:bg-[#34181d]">
                <Image
                  src={item.icon}
                  alt={item.label}
                  width={32}
                  height={32}
                  className="h-8 w-8 object-contain brightness-0 invert"
                />
              </span>
              <span className="mt-1 text-[10px] uppercase tracking-[0.12em] text-[#f0d1d1]">
                {item.label}
              </span>
            </button>
          ))}
        </div>


        {terminalOpen ? (
          <section
            ref={windowRef}
            className="relative w-full overflow-hidden border border-[#cf7a7a42] bg-[#13090cd9] shadow-[0_0_42px_rgba(207,90,90,0.16),inset_0_0_46px_rgba(90,24,24,0.22)] backdrop-blur-[2px]"
            style={
              isDesktop
                ? {
                    position: "fixed",
                    width: "min(980px, calc(100vw - 24px))",
                    left: windowPos.x,
                    top: windowPos.y,
                    boxShadow: isDragging
                      ? "0 0 62px rgba(207,90,90,0.24), inset 0 0 46px rgba(95,20,20,0.22)"
                      : undefined,
                  }
                : { position: "relative", width: "100%" }
            }
            onClick={() => inputRef.current?.focus()}
          >
            <div
              className={`flex items-center justify-between border-b border-[#cf7a7a52] bg-[#1f0f13cf] px-4 py-2 ${
                isDesktop ? "cursor-move" : ""
              }`}
              onMouseDown={onWindowBarMouseDown}
            >
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setTerminalOpen(false)}
                  className="h-2.5 w-2.5 rounded-full bg-[#ff8ea4]"
                  aria-label="Close terminal"
                />
                <span className="h-2.5 w-2.5 rounded-full bg-[#ffd08a]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#90e7a7]" />
              </div>
              <p className="text-[11px] uppercase tracking-[0.2em] text-[#f0caca]">
                Acru Cloud Console
              </p>
              <p className="text-[11px] text-[#d8aaaa]">guest@acru-cloud</p>
            </div>

            <div
              ref={outputRef}
              className="h-[68vh] overflow-y-auto px-4 py-3 font-mono text-[14px] leading-[1.35] md:text-[15px]"
            >
              {lines.map((line) => (
                <p
                  key={line.id}
                  className={
                    line.kind === "command"
                      ? "text-[#b89595]"
                      : line.kind === "error"
                        ? "text-[#ffb6c9]"
                        : line.kind === "system"
                          ? "text-[#e4a7a7]"
                          : "text-[#dfc2c2]"
                  }
                  style={{
                    textShadow: "0 0 9px rgba(220, 140, 140, 0.32)",
                    margin: 0,
                    padding: 0,
                  }}
                >
                  {line.text || "\u00A0"}
                </p>
              ))}

              {bootDone ? (
                <div className="mt-0.5 flex items-center gap-1.5 font-mono text-[14px] leading-none md:text-[15px]">
                  <span
                    className="shrink-0 text-[#f0d0d0]"
                    style={{ textShadow: "0 0 8px rgba(220,150,150,0.45)" }}
                  >
                    {prompt}
                  </span>
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    onKeyDown={onInputKeyDown}
                    className="min-w-0 flex-1 bg-transparent text-[#f2d2d2] leading-none outline-none caret-[#efb5b5]"
                    autoCapitalize="off"
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck={false}
                  />
                </div>
              ) : (
                <p className="mt-2 font-mono text-[#dd9999]">waiting for runtime...</p>
              )}
            </div>
          </section>
        ) : null}
      </main>

      <AnimatePresence>
        {isShuttingDown ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.08, ease: "easeOut" }}
            className="pointer-events-none fixed inset-0 z-[120] bg-[#040203]"
          >
            <motion.div
              className="absolute inset-0"
              initial={{ opacity: 0.26 }}
              animate={{ opacity: [0.26, 0.62, 0.44, 0.1] }}
              transition={{ duration: 1, ease: "easeInOut" }}
              style={{
                backgroundImage: "url('/DirtyGlass.jpg')",
                backgroundSize: "cover",
                backgroundPosition: "center",
                filter: "contrast(1.08) brightness(1.02)",
              }}
            />
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.95, 0.2, 0] }}
              transition={{ duration: 0.55, ease: "easeOut" }}
              className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.85),rgba(255,255,255,0.16)_24%,rgba(0,0,0,0)_52%)]"
            />
            <motion.div
              initial={{ scaleY: 1, opacity: 0.9 }}
              animate={{ scaleY: [1, 0.15, 0.02], opacity: [0.9, 1, 0.5] }}
              transition={{ duration: 0.7, ease: [0.17, 0.84, 0.44, 1] }}
              className="absolute inset-0 origin-center bg-[linear-gradient(to_bottom,transparent_36%,rgba(255,255,255,0.92)_49%,rgba(255,255,255,0.92)_51%,transparent_64%)]"
            />
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.35, 0.94] }}
              transition={{ duration: 0.72, ease: "easeInOut" }}
              className="absolute inset-0 shadow-[inset_0_0_180px_rgba(0,0,0,0.95)]"
            />
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.22, 0.96] }}
              transition={{ duration: 0.72, ease: "easeInOut" }}
              className="absolute inset-0 bg-[#020101]"
            />
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {isBootLoading ? (
          <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="fixed inset-0 z-[140] bg-[#04070f]"
          >
            <motion.div
              className="absolute inset-0"
              animate={{ opacity: [0.34, 0.52, 0.34] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
              style={{
                backgroundImage: "url('/DirtyGlass.jpg')",
                backgroundSize: "cover",
                backgroundPosition: "center",
                mixBlendMode: "overlay",
                filter: "contrast(1.08) brightness(1.02)",
              }}
            />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(220,120,120,0.08),rgba(9,4,6,0.92)_72%)]" />
            <div className="absolute left-1/2 top-1/2 w-[min(520px,88vw)] -translate-x-1/2 -translate-y-1/2 border border-[#cf7b7b5c] bg-[#190c11dc] p-5 shadow-[0_0_55px_rgba(207,90,90,0.22)]">
              <p className="font-mono text-[12px] uppercase tracking-[0.2em] text-[#f0c4c4]">
                ACRU BOOTLOADER
              </p>
              <p className="mt-1 font-mono text-[11px] text-[#d79d9d]">
                Initializing cloud desktop environment...
              </p>
              <div className="mt-4 border border-[#cf7b7b4f] bg-[#180a0f] p-1">
                <div className="h-4 w-full border border-[#b8666659] bg-[#0d0508] p-[2px]">
                  <motion.div
                    className="h-full bg-[repeating-linear-gradient(90deg,#f0a2a2_0px,#f0a2a2_6px,#d67676_6px,#d67676_10px)] shadow-[0_0_16px_rgba(220,120,120,0.42)]"
                    style={{ width: `${bootProgress}%` }}
                  />
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between font-mono text-[11px] text-[#e1aeae]">
                <span>Loading modules...</span>
                <span>{Math.floor(bootProgress)}%</span>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
