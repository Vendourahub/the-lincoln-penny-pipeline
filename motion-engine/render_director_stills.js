const { bundle } = require("@remotion/bundler");
const { renderStill, getCompositions } = require("@remotion/renderer");
const path = require("path");
const fs = require("fs");

async function main() {
  console.log("[*] Bundling Remotion video entrypoint for DirectedPodcastScene...");
  const entry = path.resolve(__dirname, "src/index.ts");
  const bundled = await bundle({
    entryPoint: entry,
    webpackOverride: (config) => config,
  });
  console.log("[✓] Bundle complete:", bundled);

  const comps = await getCompositions(bundled);
  const comp = comps.find((c) => c.id === "DirectedPodcastScene");
  if (!comp) {
    throw new Error("Composition DirectedPodcastScene not found!");
  }
  console.log(`[✓] Found composition: ${comp.id} (${comp.width}x${comp.height}, ${comp.durationInFrames} frames)`);

  const outDir = path.resolve(__dirname, "../out/director_frames");
  fs.mkdirSync(outDir, { recursive: true });

  const shotsToRender = [
    { frame: 60, name: "dir1_host_intro_closeup", note: "Shot 0: Host Close-up (scale 1.20x, panX +175)" },
    { frame: 300, name: "dir2_insider_revelation_closeup", note: "Shot 1: Insider Close-up (scale 1.22x, panX -175)" },
    { frame: 445, name: "dir3_host_reaction_shock_punchin", note: "Shot 2: Host Shock Punch-in (scale 1.38x, panX +215)" },
    { frame: 600, name: "dir4_evidence_split_30B_deed", note: "Shot 3: Evidence Split with $30B Franchise Realty Deed" },
    { frame: 870, name: "dir5_host_clarifying_challenge", note: "Shot 4: Host Challenge Close-up (scale 1.20x)" },
    { frame: 1000, name: "dir6_insider_payoff_80pct_profit", note: "Shot 5: Insider Smirk & 80% Profit Stat Card" },
  ];

  for (const s of shotsToRender) {
    const outPath = path.join(outDir, `${s.name}_f${s.frame}.png`);
    console.log(`[*] Rendering Directed Shot (frame ${s.frame}: ${s.note}) -> ${path.basename(outPath)}...`);
    await renderStill({
      composition: comp,
      serveUrl: bundled,
      frame: s.frame,
      output: outPath,
    });
    console.log(`[✓] Rendered successfully: ${outPath}`);
  }

  console.log("[✓] ALL DIRECTED SCENE SHOTS RENDERED CLEANLY!");
}

main().catch((err) => {
  console.error("Director render failed:", err);
  process.exit(1);
});
