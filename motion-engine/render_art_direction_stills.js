const { bundle } = require("@remotion/bundler");
const { renderStill, getCompositions } = require("@remotion/renderer");
const path = require("path");
const fs = require("fs");

async function main() {
  console.log("[*] Bundling Remotion video entrypoint for Art Direction & Lineup Proof...");
  const entry = path.resolve(__dirname, "src/index.ts");
  const bundled = await bundle({
    entryPoint: entry,
    webpackOverride: (config) => config,
  });
  console.log("[OK] Bundle complete:", bundled);

  const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
  console.log("[*] Using local Chrome executable:", chromePath);

  const comps = await getCompositions(bundled, {
    browserExecutable: chromePath,
  });
  const outDir = path.resolve(__dirname, "../out/art_direction_frames");
  fs.mkdirSync(outDir, { recursive: true });

  const targets = [
    {
      compId: "CharacterLineupStudio",
      frame: 30,
      filename: "proof1_studio_two_shot.png",
      desc: "Gate 1 & 4: Seated Studio Two-Shot with 3-Layer Set"
    },
    {
      compId: "CharacterLineupSilhouette",
      frame: 0,
      filename: "proof2_silhouette_gate.png",
      desc: "Gate 2: Pure Solid Black Silhouette Verification"
    },
    {
      compId: "CharacterLineupExpressions",
      frame: 0,
      filename: "proof3_expression_sheets.png",
      desc: "Gate 5: 6 Performance Expression Sheets (Host vs. Insider)"
    }
  ];

  for (const t of targets) {
    const comp = comps.find((c) => c.id === t.compId);
    if (!comp) {
      throw new Error(`Composition ${t.compId} not found!`);
    }
    const outPath = path.join(outDir, t.filename);
    console.log(`[*] Rendering ${t.desc} (Frame ${t.frame}) -> ${t.filename}...`);
    await renderStill({
      composition: comp,
      serveUrl: bundled,
      frame: t.frame,
      output: outPath,
      browserExecutable: chromePath,
    });
    console.log(`[OK] Rendered successfully: ${outPath}`);
  }

  console.log("[OK] ALL ART DIRECTION PROOF FRAMES RENDERED CLEANLY!");
}

main().catch((err) => {
  console.error("Art direction render failed:", err);
  process.exit(1);
});
