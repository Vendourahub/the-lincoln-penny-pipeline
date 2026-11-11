const { bundle } = require("@remotion/bundler");
const { renderStill, getCompositions } = require("@remotion/renderer");
const path = require("path");
const fs = require("fs");

async function main() {
  console.log("[*] Bundling Remotion video entrypoint once...");
  const entry = path.resolve(__dirname, "src/index.ts");
  const bundled = await bundle({
    entryPoint: entry,
    webpackOverride: (config) => config,
  });
  console.log("[✓] Bundle complete:", bundled);

  const comps = await getCompositions(bundled);
  const comp = comps.find((c) => c.id === "SilentActingTest");
  if (!comp) {
    throw new Error("Composition SilentActingTest not found!");
  }
  console.log(`[✓] Found composition: ${comp.id} (${comp.width}x${comp.height}, ${comp.durationInFrames} frames)`);

  const outDir = path.resolve(__dirname, "../out/acting_test_frames");
  fs.mkdirSync(outDir, { recursive: true });

  const stages = [
    { frame: 30, stage: 1, name: "stage1_host_sits_naturally" },
    { frame: 80, stage: 2, name: "stage2_host_becomes_curious" },
    { frame: 140, stage: 3, name: "stage3_insider_explains" },
    { frame: 200, stage: 4, name: "stage4_insider_gestures" },
    { frame: 270, stage: 5, name: "stage5_host_reacts_shock" },
    { frame: 330, stage: 6, name: "stage6_host_leans_forward" },
    { frame: 390, stage: 7, name: "stage7_insider_smiles" },
    { frame: 435, stage: 8, name: "stage8_return_to_rest" },
  ];

  for (const s of stages) {
    const outPath = path.join(outDir, `${s.name}_f${s.frame}.png`);
    console.log(`[*] Rendering Stage ${s.stage} (frame ${s.frame}) -> ${path.basename(outPath)}...`);
    await renderStill({
      composition: comp,
      serveUrl: bundled,
      frame: s.frame,
      output: outPath,
    });
    console.log(`[✓] Stage ${s.stage} rendered successfully: ${outPath}`);
  }

  console.log("[✓] ALL 8 STAGES RENDERED CLEANLY!");
}

main().catch((err) => {
  console.error("Render failed:", err);
  process.exit(1);
});
