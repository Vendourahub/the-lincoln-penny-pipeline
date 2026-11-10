import React from "react";
import {
  AbsoluteFill,
  Audio,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  Shield,
  Key,
  Users,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Server,
  Database,
  Terminal,
  ArrowRight,
  Clock,
  Laptop,
  FileText,
  DollarSign,
  Cpu,
} from "lucide-react";
import { FONTS } from "./fonts";

export const VenWardMasterShort: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps; // 0.0s to 20.0s (600 frames)

  // Global ambient camera push-in
  const globalZoom = interpolate(frame, [0, 600], [1.0, 1.05], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#07080d",
        color: "#f8fafc",
        fontFamily: FONTS.sans,
        overflow: "hidden",
      }}
    >
      {/* 120 BPM Cyber-Pulse Audio Track */}
      <Audio src={staticFile("venward_audio.wav")} volume={0.88} />

      {/* Dynamic Background Mesh & Lighting */}
      <div
        style={{
          position: "absolute",
          inset: -100,
          background:
            "radial-gradient(circle at 50% 35%, rgba(59, 130, 246, 0.12) 0%, rgba(16, 185, 129, 0.04) 40%, rgba(7, 8, 13, 0) 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Cyber Grid Texture */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(255, 255, 255, 0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.025) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
          pointerEvents: "none",
        }}
      />

      {/* Global Top Mission Control Navigation Bar */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 60,
          background: "rgba(11, 13, 20, 0.85)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0 48px",
          zIndex: 50,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              backgroundColor: frame % 20 < 10 ? "#22c55e" : "#15803d",
              boxShadow: "0 0 12px #22c55e",
            }}
          />
          <span
            style={{
              fontFamily: FONTS.mono,
              fontSize: 14,
              letterSpacing: "0.15em",
              color: "#38bdf8",
              fontWeight: 600,
            }}
          >
            VENWARD // SOVEREIGN FOUNDER COCKPIT
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <span
            style={{
              fontFamily: FONTS.mono,
              fontSize: 13,
              color: "#94a3b8",
            }}
          >
            INSTANCE: <span style={{ color: "#f8fafc" }}>ward.vendoura.com</span>
          </span>
          <div
            style={{
              padding: "4px 10px",
              background: "rgba(34, 197, 94, 0.12)",
              border: "1px solid rgba(34, 197, 94, 0.4)",
              borderRadius: 6,
              fontFamily: FONTS.mono,
              fontSize: 11,
              color: "#4ade80",
              fontWeight: 700,
            }}
          >
            POSTGRES ENGINE: ONLINE
          </div>
        </div>
      </div>

      {/* SCENE CONTAINER */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `scale(${globalZoom})`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* ========================================================= */}
        {/* SCENE 1: The SaaS Sprawl Disruption (0.0s - 3.2s / F0-96) */}
        {/* ========================================================= */}
        {frame < 96 && (
          <Scene1Disruption frame={frame} fps={fps} />
        )}

        {/* ========================================================= */}
        {/* SCENE 2: The Founder Cockpit Telemetry (3.0s - 8.2s / F90-246) */}
        {/* ========================================================= */}
        {frame >= 90 && frame < 246 && (
          <Scene2Cockpit frame={frame - 90} fps={fps} />
        )}

        {/* ========================================================= */}
        {/* SCENE 3: The 8-Step Onboarding Engine (8.0s - 14.2s / F240-426) */}
        {/* ========================================================= */}
        {frame >= 240 && frame < 426 && (
          <Scene3OnboardingWaterfall frame={frame - 240} fps={fps} />
        )}

        {/* ========================================================= */}
        {/* SCENE 4: Break-Glass Vaults & Key Rotation (14.0s - 17.5s / F420-525) */}
        {/* ========================================================= */}
        {frame >= 420 && frame < 525 && (
          <Scene4SecurityVault frame={frame - 420} fps={fps} />
        )}

        {/* ========================================================= */}
        {/* SCENE 5: The Sovereign Close & Growth CTA (17.3s - 20.0s / F520-600) */}
        {/* ========================================================= */}
        {frame >= 520 && (
          <Scene5SovereignClose frame={frame - 520} fps={fps} />
        )}
      </div>
    </AbsoluteFill>
  );
};

// -------------------------------------------------------------
// SCENE 1 COMPONENT: The Sprawl Disruption
// -------------------------------------------------------------
const Scene1Disruption: React.FC<{ frame: number; fps: number }> = ({
  frame,
  fps,
}) => {
  const introSpring = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 120, mass: 0.8 },
  });

  const card1Spring = spring({ frame: frame - 8, fps });
  const card2Spring = spring({ frame: frame - 16, fps });
  const card3Spring = spring({ frame: frame - 24, fps });
  const card4Spring = spring({ frame: frame - 32, fps });

  const exitOpacity = interpolate(frame, [80, 95], [1, 0], {
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        width: 1400,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        opacity: exitOpacity,
        transform: `translateY(${interpolate(introSpring, [0, 1], [40, 0])}px)`,
      }}
    >
      {/* Warning Badge */}
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 10,
          padding: "8px 20px",
          background: "rgba(239, 68, 68, 0.15)",
          border: "1px solid rgba(239, 68, 68, 0.5)",
          borderRadius: 999,
          color: "#f87171",
          fontFamily: FONTS.mono,
          fontSize: 14,
          fontWeight: 700,
          marginBottom: 24,
          boxShadow: "0 0 25px rgba(239, 68, 68, 0.25)",
        }}
      >
        <AlertTriangle size={18} />
        SYSTEMIC OPERATIONAL SPRAWL DETECTED
      </div>

      <h1
        style={{
          fontSize: 68,
          fontWeight: 900,
          letterSpacing: "-0.03em",
          lineHeight: 1.1,
          marginBottom: 16,
          background: "linear-gradient(180deg, #ffffff 30%, #94a3b8 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        Stop Running Your Company Across
        <br />
        <span style={{ color: "#ef4444", WebkitTextFillColor: "#ef4444" }}>
          14 Fragmented SaaS Subscriptions.
        </span>
      </h1>

      <p
        style={{
          fontSize: 22,
          color: "#94a3b8",
          maxWidth: 900,
          lineHeight: 1.5,
          marginBottom: 48,
        }}
      >
        Scattered Notion checklists, lost Slack credentials, and ghost access surviving
        offboarded employees bleed momentum.
      </p>

      {/* 4 Staggered Friction Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 20,
          width: "100%",
        }}
      >
        {[
          {
            title: "Fragmented HR",
            sub: "Manual spreadsheets & onboarding friction",
            springVal: card1Spring,
            icon: Users,
          },
          {
            title: "Leaked Vaults",
            sub: "Unaudited Slack & 1Password password shares",
            springVal: card2Spring,
            icon: Key,
          },
          {
            title: "Ghost Access",
            sub: "Zero centralized revocation killswitch",
            springVal: card3Spring,
            icon: Lock,
          },
          {
            title: "Blind Telemetry",
            sub: "No single pane for executive company health",
            springVal: card4Spring,
            icon: Activity,
          },
        ].map((item, i) => (
          <div
            key={i}
            style={{
              background: "rgba(20, 15, 20, 0.75)",
              border: "1px solid rgba(239, 68, 68, 0.35)",
              borderRadius: 16,
              padding: "24px 20px",
              textAlign: "left",
              transform: `scale(${item.springVal}) translateY(${interpolate(
                item.springVal,
                [0, 1],
                [30, 0]
              )}px)`,
              opacity: item.springVal,
              boxShadow: "0 10px 30px rgba(0, 0, 0, 0.5)",
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                background: "rgba(239, 68, 68, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ef4444",
                marginBottom: 14,
              }}
            >
              <item.icon size={22} />
            </div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: "#f8fafc",
                marginBottom: 6,
              }}
            >
              {item.title}
            </div>
            <div
              style={{
                fontSize: 13,
                color: "#94a3b8",
                lineHeight: 1.4,
              }}
            >
              {item.sub}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// SCENE 2 COMPONENT: The Founder Cockpit Telemetry
// -------------------------------------------------------------
const Scene2Cockpit: React.FC<{ frame: number; fps: number }> = ({
  frame,
  fps,
}) => {
  const intro = spring({ frame, fps, config: { damping: 13, stiffness: 130 } });
  const exitOpacity = interpolate(frame, [135, 155], [1, 0], {
    extrapolateRight: "clamp",
  });

  // Numeric count-up interpolations
  const countProgress = Math.min(1.0, frame / 40);
  const financialVal = Math.floor(142500 * countProgress);
  const peopleVal = Math.floor(42 * countProgress);
  const credsVal = Math.floor(128 * countProgress);
  const tasksVal = Math.floor(86 * countProgress);

  return (
    <div
      style={{
        width: 1500,
        opacity: exitOpacity,
        transform: `scale(${interpolate(intro, [0, 1], [0.94, 1.0])})`,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          marginBottom: 28,
        }}
      >
        <div>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              fontFamily: FONTS.mono,
              fontSize: 13,
              color: "#38bdf8",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              marginBottom: 8,
            }}
          >
            <Cpu size={16} /> LIVE TELEMETRY MATRIX // src/app/(dashboard)/founder
          </div>
          <h2 style={{ fontSize: 42, fontWeight: 800, letterSpacing: "-0.02em" }}>
            Founder Command Center: Sovereign Real-Time Telemetry
          </h2>
        </div>

        <div
          style={{
            padding: "8px 16px",
            background: "rgba(59, 130, 246, 0.15)",
            border: "1px solid rgba(59, 130, 246, 0.4)",
            borderRadius: 8,
            fontFamily: FONTS.mono,
            fontSize: 13,
            color: "#60a5fa",
          }}
        >
          POSTGRESQL AUDIT SYNC: ACTIVE
        </div>
      </div>

      {/* 4 Telemetry Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 20,
          marginBottom: 32,
        }}
      >
        {[
          {
            label: "FINANCIAL IMPACT",
            val: `$${financialVal.toLocaleString()}`,
            sub: "Org Value Generated",
            color: "#3b82f6",
            icon: DollarSign,
          },
          {
            label: "ACTIVE WORKFORCE",
            val: `${peopleVal}`,
            sub: "Verified Team Members",
            color: "#22c55e",
            icon: Users,
          },
          {
            label: "STORED CREDENTIALS",
            val: `${credsVal}`,
            sub: "AES-256 Vault Records",
            color: "#eab308",
            icon: Key,
          },
          {
            label: "OPERATIONAL TASKS",
            val: `${tasksVal}`,
            sub: "Active Protocol Workflows",
            color: "#a855f7",
            icon: Activity,
          },
        ].map((card, i) => (
          <div
            key={i}
            style={{
              background: "rgba(17, 18, 28, 0.85)",
              border: `1px solid ${card.color}40`,
              borderRadius: 18,
              padding: "24px 22px",
              boxShadow: `0 12px 35px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.08)`,
              backdropFilter: "blur(16px)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <span
                style={{
                  fontFamily: FONTS.mono,
                  fontSize: 12,
                  color: "#94a3b8",
                  letterSpacing: "0.08em",
                }}
              >
                {card.label}
              </span>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: `${card.color}20`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: card.color,
                }}
              >
                <card.icon size={18} />
              </div>
            </div>
            <div
              style={{
                fontSize: 38,
                fontWeight: 900,
                color: card.color,
                fontFamily: FONTS.mono,
                letterSpacing: "-0.03em",
                marginBottom: 6,
              }}
            >
              {card.val}
            </div>
            <div style={{ fontSize: 13, color: "#64748b" }}>{card.sub}</div>
          </div>
        ))}
      </div>

      {/* Live Activity Stream Table */}
      <div
        style={{
          background: "rgba(13, 15, 24, 0.9)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: 18,
          padding: "24px 28px",
          boxShadow: "0 20px 50px rgba(0, 0, 0, 0.7)",
        }}
      >
        <div
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: "#f8fafc",
            marginBottom: 16,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <Terminal size={18} color="#38bdf8" />
          IMMUTABLE POSTGRESQL AUDIT STREAM (LIVE CAPTURE)
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            {
              action: "auth.login",
              user: "admin@vendoura.com",
              detail: "TOTP 2FA Verification Successful (IP Masked)",
              time: "just now",
              color: "#22c55e",
            },
            {
              action: "credentials.share",
              user: "temitope@vendoura.com",
              detail: "Scoped Access Granted: Production VPS SSH Key (AES-256)",
              time: "2m ago",
              color: "#3b82f6",
            },
            {
              action: "onboarding.create",
              user: "emmanuel@vendoura.com",
              detail: "Triggered 8-Step Deterministic Onboarding Protocol",
              time: "5m ago",
              color: "#a855f7",
            },
            {
              action: "rotate.key",
              user: "system.watchdog",
              detail: "90-Day Cryptographic Key Rotation Verified (Postfix/IMAP)",
              time: "24m ago",
              color: "#eab308",
            },
          ].map((row, idx) => (
            <div
              key={idx}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 14px",
                background: "rgba(255, 255, 255, 0.02)",
                borderRadius: 8,
                border: "1px solid rgba(255, 255, 255, 0.04)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <span
                  style={{
                    padding: "3px 8px",
                    borderRadius: 4,
                    background: `${row.color}18`,
                    border: `1px solid ${row.color}50`,
                    fontFamily: FONTS.mono,
                    fontSize: 11,
                    color: row.color,
                    fontWeight: 700,
                  }}
                >
                  {row.action}
                </span>
                <span style={{ fontSize: 14, fontWeight: 600, color: "#f8fafc" }}>
                  {row.user}
                </span>
                <span style={{ fontSize: 13, color: "#94a3b8" }}>{row.detail}</span>
              </div>
              <span
                style={{
                  fontFamily: FONTS.mono,
                  fontSize: 12,
                  color: "#64748b",
                }}
              >
                {row.time}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// SCENE 3 COMPONENT: The 8-Step Onboarding Waterfall
// -------------------------------------------------------------
const Scene3OnboardingWaterfall: React.FC<{ frame: number; fps: number }> = ({
  frame,
  fps,
}) => {
  const intro = spring({ frame, fps, config: { damping: 14, stiffness: 120 } });
  const exitOpacity = interpolate(frame, [160, 184], [1, 0], {
    extrapolateRight: "clamp",
  });

  const steps = [
    { title: "1. Create User Account in Auth DB", icon: Users },
    { title: "2. Assign Department & RBAC Security Role", icon: Shield },
    { title: "3. Assign Scoped Knowledge Collections", icon: Database },
    { title: "4. Deliver Sovereign Company Handbook", icon: FileText },
    { title: "5. Execute Bilateral NDA & Agreement", icon: FileText },
    { title: "6. Provision Hardware Assets & Equipment", icon: Laptop },
    { title: "7. Grant Infrastructure Access & Keys", icon: Key },
    { title: "8. Schedule Executive Founder Orientation", icon: Clock },
  ];

  // Each step completes every 18 frames (~0.6s)
  const activeStepCount = Math.min(8, Math.floor(frame / 18) + 1);

  return (
    <div
      style={{
        width: 1460,
        opacity: exitOpacity,
        transform: `translateY(${interpolate(intro, [0, 1], [30, 0])}px)`,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          marginBottom: 30,
        }}
      >
        <div>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              fontFamily: FONTS.mono,
              fontSize: 13,
              color: "#34d399",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              marginBottom: 8,
            }}
          >
            <CheckCircle2 size={16} /> DETERMINISTIC LIFECYCLE ENGINE // api/onboarding
          </div>
          <h2 style={{ fontSize: 44, fontWeight: 900, letterSpacing: "-0.02em" }}>
            Automated 8-Step Employee Onboarding Sequence
          </h2>
        </div>

        <div
          style={{
            padding: "8px 18px",
            background: "rgba(34, 197, 94, 0.15)",
            border: "1px solid #22c55e",
            borderRadius: 8,
            fontFamily: FONTS.mono,
            fontSize: 14,
            color: "#4ade80",
            fontWeight: 700,
          }}
        >
          {activeStepCount} OF 8 PROTOCOLS EXECUTED
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: 16,
        }}
      >
        {steps.map((st, idx) => {
          const isDone = idx < activeStepCount;
          const stepSpring = spring({ frame: frame - idx * 18, fps });

          return (
            <div
              key={idx}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "20px 24px",
                background: isDone
                  ? "rgba(16, 44, 30, 0.85)"
                  : "rgba(14, 16, 24, 0.7)",
                border: isDone
                  ? "1px solid #22c55e"
                  : "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: 14,
                boxShadow: isDone
                  ? "0 0 25px rgba(34, 197, 94, 0.15)"
                  : "none",
                transform: `scale(${interpolate(
                  stepSpring,
                  [0, 1],
                  [0.96, 1.0]
                )})`,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 10,
                    background: isDone ? "#22c55e" : "rgba(255, 255, 255, 0.05)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: isDone ? "#07080d" : "#64748b",
                  }}
                >
                  <st.icon size={22} />
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 19,
                      fontWeight: 700,
                      color: isDone ? "#f8fafc" : "#94a3b8",
                      marginBottom: 3,
                    }}
                  >
                    {st.title}
                  </div>
                  <div
                    style={{
                      fontFamily: FONTS.mono,
                      fontSize: 12,
                      color: isDone ? "#4ade80" : "#64748b",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {isDone ? "VERIFIED IN POSTGRESQL (audit.log)" : "PENDING QUEUE"}
                  </div>
                </div>
              </div>

              {isDone ? (
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: "rgba(34, 197, 94, 0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#22c55e",
                  }}
                >
                  <CheckCircle2 size={24} />
                </div>
              ) : (
                <div
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: "50%",
                    border: "2px solid rgba(255, 255, 255, 0.2)",
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// SCENE 4 COMPONENT: Break-Glass Vaults & Key Rotation
// -------------------------------------------------------------
const Scene4SecurityVault: React.FC<{ frame: number; fps: number }> = ({
  frame,
  fps,
}) => {
  const intro = spring({ frame, fps, config: { damping: 14, stiffness: 120 } });
  const exitOpacity = interpolate(frame, [85, 104], [1, 0], {
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        width: 1480,
        opacity: exitOpacity,
        transform: `scale(${interpolate(intro, [0, 1], [0.95, 1.0])})`,
      }}
    >
      <div style={{ marginBottom: 26 }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            fontFamily: FONTS.mono,
            fontSize: 13,
            color: "#f87171",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            marginBottom: 8,
          }}
        >
          <Lock size={16} /> HIGH-SECURITY INFRASTRUCTURE // /emergency & /rotate
        </div>
        <h2 style={{ fontSize: 44, fontWeight: 900, letterSpacing: "-0.02em" }}>
          Break-Glass Emergency Vaults & 90-Day Key Rotation
        </h2>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28 }}>
        {/* Left: Break Glass Vault */}
        <div
          style={{
            background: "rgba(24, 14, 18, 0.85)",
            border: "1px solid rgba(239, 68, 68, 0.6)",
            borderRadius: 20,
            padding: "32px 28px",
            boxShadow: "0 0 40px rgba(239, 68, 68, 0.15)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 20,
            }}
          >
            <div style={{ fontSize: 22, fontWeight: 800, color: "#f87171" }}>
              ARMED EMERGENCY BREAK-GLASS VAULTS
            </div>
            <span
              style={{
                padding: "4px 10px",
                background: "rgba(239, 68, 68, 0.2)",
                border: "1px solid #ef4444",
                borderRadius: 6,
                fontFamily: FONTS.mono,
                fontSize: 11,
                color: "#fca5a5",
                fontWeight: 700,
              }}
            >
              AES-256 GCM
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              {
                title: "CEO Break-Glass Vault",
                desc: "Root master seed & primary recovery tokens",
              },
              {
                title: "Financial Escrow Vault",
                desc: "Banking credentials & payment gateway secret keys",
              },
              {
                title: "Technical Infrastructure Vault",
                desc: "Root VPS SSH credentials & PostgreSQL master passwords",
              },
              {
                title: "Legal & Corporate Archive",
                desc: "Signed share registries & executive resolutions",
              },
            ].map((v, i) => (
              <div
                key={i}
                style={{
                  padding: "16px 18px",
                  background: "rgba(36, 18, 24, 0.8)",
                  border: "1px solid rgba(239, 68, 68, 0.25)",
                  borderRadius: 12,
                }}
              >
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: "#f8fafc",
                    marginBottom: 4,
                  }}
                >
                  {v.title}
                </div>
                <div style={{ fontSize: 13, color: "#cbd5e1" }}>{v.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: 90-Day Key Rotation */}
        <div
          style={{
            background: "rgba(14, 20, 32, 0.85)",
            border: "1px solid rgba(59, 130, 246, 0.6)",
            borderRadius: 20,
            padding: "32px 28px",
            boxShadow: "0 0 40px rgba(59, 130, 246, 0.15)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 20,
            }}
          >
            <div style={{ fontSize: 22, fontWeight: 800, color: "#60a5fa" }}>
              90-DAY KEY ROTATION CADENCE
            </div>
            <span
              style={{
                padding: "4px 10px",
                background: "rgba(59, 130, 246, 0.2)",
                border: "1px solid #3b82f6",
                borderRadius: 6,
                fontFamily: FONTS.mono,
                fontSize: 11,
                color: "#93c5fd",
                fontWeight: 700,
              }}
            >
              ZERO SPILL
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              {
                title: "Production VPS SSH Keys",
                status: "VERIFIED SECURE",
                date: "Next Rotation: 12 Days",
                color: "#22c55e",
              },
              {
                title: "Postfix / IMAP System Secrets",
                status: "ROTATED RECENTLY",
                date: "Audited Oct 24, 2026",
                color: "#3b82f6",
              },
              {
                title: "Stripe Production Webhook Secrets",
                status: "HEALTHY",
                date: "Audited Sep 12, 2026",
                color: "#22c55e",
              },
              {
                title: "PostgreSQL Database Engine Creds",
                status: "HEARTBEAT OK",
                date: "Watchdog Verified",
                color: "#22c55e",
              },
            ].map((r, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "16px 18px",
                  background: "rgba(20, 28, 46, 0.8)",
                  border: "1px solid rgba(59, 130, 246, 0.25)",
                  borderRadius: 12,
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 700,
                      color: "#f8fafc",
                      marginBottom: 4,
                    }}
                  >
                    {r.title}
                  </div>
                  <div
                    style={{
                      fontFamily: FONTS.mono,
                      fontSize: 12,
                      color: "#94a3b8",
                    }}
                  >
                    {r.date}
                  </div>
                </div>

                <span
                  style={{
                    padding: "4px 10px",
                    background: `${r.color}20`,
                    border: `1px solid ${r.color}60`,
                    borderRadius: 6,
                    fontFamily: FONTS.mono,
                    fontSize: 11,
                    color: r.color,
                    fontWeight: 700,
                  }}
                >
                  {r.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// SCENE 5 COMPONENT: The Sovereign Resolution & Growth Funnel
// -------------------------------------------------------------
const Scene5SovereignClose: React.FC<{ frame: number; fps: number }> = ({
  frame,
  fps,
}) => {
  const intro = spring({ frame, fps, config: { damping: 13, stiffness: 110 } });

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        transform: `scale(${interpolate(intro, [0, 1], [0.85, 1.0])})`,
      }}
    >
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 10,
          padding: "8px 22px",
          background: "rgba(34, 197, 94, 0.15)",
          border: "1px solid #22c55e",
          borderRadius: 999,
          color: "#4ade80",
          fontFamily: FONTS.mono,
          fontSize: 14,
          fontWeight: 700,
          marginBottom: 20,
          boxShadow: "0 0 30px rgba(34, 197, 94, 0.25)",
        }}
      >
        <Shield size={18} />
        TOTAL OPERATIONAL SOVEREIGNTY ACHIEVED
      </div>

      <h1
        style={{
          fontSize: 98,
          fontWeight: 900,
          letterSpacing: "-0.04em",
          lineHeight: 1.0,
          marginBottom: 14,
          background: "linear-gradient(180deg, #ffffff 40%, #94a3b8 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        VENWARD
      </h1>

      <p
        style={{
          fontSize: 28,
          color: "#38bdf8",
          fontWeight: 600,
          marginBottom: 36,
        }}
      >
        The Constrained Founder Operating System
      </p>

      {/* Main Glassmorphic CTA Card */}
      <div
        style={{
          background: "rgba(17, 18, 28, 0.9)",
          border: "1px solid rgba(59, 130, 246, 0.5)",
          borderRadius: 24,
          padding: "36px 64px",
          boxShadow:
            "0 25px 60px rgba(0, 0, 0, 0.8), 0 0 50px rgba(59, 130, 246, 0.2)",
          marginBottom: 28,
        }}
      >
        <div
          style={{
            fontFamily: FONTS.mono,
            fontSize: 13,
            color: "#94a3b8",
            letterSpacing: "0.15em",
            marginBottom: 8,
          }}
        >
          PRODUCTION DEPLOYMENT // LIVE COCKPIT
        </div>
        <div
          style={{
            fontSize: 40,
            fontWeight: 800,
            color: "#22c55e",
            fontFamily: FONTS.mono,
            letterSpacing: "-0.02em",
          }}
        >
          https://ward.vendoura.com
        </div>
      </div>

      {/* Inbound Growth Loop Trigger */}
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 14,
          padding: "16px 32px",
          background: "rgba(255, 255, 255, 0.05)",
          border: "1px solid rgba(255, 255, 255, 0.15)",
          borderRadius: 14,
          fontFamily: FONTS.sans,
          fontSize: 20,
          color: "#f8fafc",
          fontWeight: 700,
        }}
      >
        <span>Comment <strong style={{ color: "#38bdf8" }}>"WARD"</strong> for PostgreSQL Schema & Architecture PDF</span>
        <ArrowRight size={22} color="#38bdf8" />
      </div>
    </div>
  );
};
