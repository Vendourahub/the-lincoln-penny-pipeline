const { bundle } = require("@remotion/bundler");
const { renderStill, getCompositions } = require("@remotion/renderer");
const path = require("path");
const fs = require("fs");

async function main() {
  console.log("[*] Bundling Remotion video entrypoint for DialogueSyncTest...");
  const entry = path.resolve(__dirname, "src/index.ts");
  const bundled = await bundle({
    entryPoint: entry,
    webpackOverride: (config) => config,
  });
  console.log("[✓] Bundle complete:", bundled);

  const comps = await getCompositions(bundled);
  const comp = comps.find((c) => c.id === "DialogueSyncTest");
  if (!comp) {
    throw new Error("Composition DialogueSyncTest not found!");
  }
  console.log(`[✓] Found composition: ${comp.id} (${comp.width}x${comp.height}, ${comp.durationInFrames} frames)`);

  const outDir = path.resolve(__dirname, "../out/dialogue_sync_frames");
  fs.mkdirSync(outDir, { recursive: true });

  const moments = [
    { frame: 30, name: "sync1_host_articulating_about", note: "Host speech: open vowel [OPEN_A]" },
    { frame: 180, name: "sync2_host_articulating_knows", note: "Host speech: rounded vowel [OPEN_O]" },
    { frame: 247, name: "sync3_turn_pause_silence", note: "Turn pause: both mouths in rest [REST] 0%" },
    { frame: 300, name: "sync4_insider_articulating_burger", note: "Insider speech: bilabial/vowel [CLOSED]" },
    { frame: 360, name: "sync5_insider_articulating_real_estate", note: "Insider speech: wide vowel [WIDE_EE]" },
    { frame: 445, name: "sync6_host_shock_articulating_what", note: "Host shock punch: wide jaw drop [SHOCK]" },
    { frame: 540, name: "sync7_insider_articulating_land", note: "Insider explanation: open vowel [OPEN_A]" },
  ];

  for (const m of moments) {
    const outPath = path.join(outDir, `${m.name}_f${m.frame}.png`);
    console.log(`[*] Rendering Dialogue Moment (frame ${m.frame}: ${m.note}) -> ${path.basename(outPath)}...`);
    await renderStill({
      composition: comp,
      serveUrl: bundled,
      frame: m.frame,
      output: outPath,
    });
    console.log(`[✓] Rendered successfully: ${outPath}`);
  }

  console.log("[✓] ALL DIALOGUE SYNCHRONIZATION FRAMES RENDERED CLEANLY!");
}

main().catch((err) => {
  console.error("Dialogue sync render failed:", err);
  process.exit(1);
});
