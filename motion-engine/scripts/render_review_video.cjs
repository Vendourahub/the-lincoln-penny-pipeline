const path = require("path");
const fs = require("fs");
const { bundle } = require("@remotion/bundler");
const { getCompositions, renderMedia } = require("@remotion/renderer");

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const ARTIFACTS_DIR = "C:\\Users\\pc\\.gemini\\antigravity\\brain\\4ad00f23-0ef8-4957-944f-f262bbae8fb5";
const OUT_DIR = path.resolve(__dirname, "../../out");

async function main() {
  const args = process.argv.slice(2);
  const isFull = args.includes("--full") || !args.some((a) => a.startsWith("--frames="));
  let customFrames = null;
  const framesArg = args.find((a) => a.startsWith("--frames="));
  if (framesArg) {
    customFrames = parseInt(framesArg.split("=")[1], 10);
  }

  console.log("================================================================");
  console.log(" THE LINCOLN PENNY — REVIEW SAMPLE VIDEO RENDERER");
  console.log("================================================================");

  console.log("[*] Bundling motion-engine entrypoint...");
  const entry = path.resolve(__dirname, "../src/index.ts");
  const bundleLocation = await bundle({
    entryPoint: entry,
    webpackOverride: (config) => config,
  });
  console.log("[✓] Bundle ready:", bundleLocation);

  console.log("[*] Querying compositions via local Chrome...");
  const comps = await getCompositions(bundleLocation, {
    browserExecutable: CHROME_PATH,
  });

  const costcoComp = comps.find((c) => c.id === "CostcoHotdogShort" || c.id === "DirectedPodcastScene");
  if (!costcoComp) {
    throw new Error("Target composition CostcoHotdogShort not found in Root!");
  }

  const totalFrames = customFrames || costcoComp.durationInFrames;
  console.log(`[✓] Selected composition: ${costcoComp.id}`);
  console.log(`    Resolution: ${costcoComp.width}x${costcoComp.height} (9:16 Vertical Broadcast)`);
  console.log(`    Duration:   ${totalFrames} frames (~${(totalFrames / costcoComp.fps).toFixed(1)}s at ${costcoComp.fps} fps)`);

  const outFilename = "the_lincoln_penny_costco_review_sample.mp4";
  const artifactVideoPath = path.join(ARTIFACTS_DIR, outFilename);
  const repoVideoPath = path.join(OUT_DIR, outFilename);

  fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
  fs.mkdirSync(OUT_DIR, { recursive: true });

  console.log(`\n[*] Rendering MP4 with H.264 / AAC to:\n    -> ${artifactVideoPath}`);

  let lastPercent = -1;
  const startTime = Date.now();

  await renderMedia({
    composition: costcoComp,
    serveUrl: bundleLocation,
    codec: "h264",
    outputLocation: artifactVideoPath,
    browserExecutable: CHROME_PATH,
    frameRange: [0, totalFrames - 1],
    onProgress: ({ renderedFrames }) => {
      const pct = Math.floor((renderedFrames / totalFrames) * 100);
      if (pct !== lastPercent && pct % 10 === 0) {
        lastPercent = pct;
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        const fpsRate = (renderedFrames / (elapsed || 1)).toFixed(1);
        console.log(`  [Progress] ${pct}% (${renderedFrames}/${totalFrames} frames) — ${elapsed}s elapsed (${fpsRate} fps)`);
      }
    },
  });

  // Copy to out/ in repository
  fs.copyFileSync(artifactVideoPath, repoVideoPath);

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);
  const stat = fs.statSync(artifactVideoPath);
  console.log("\n================================================================");
  console.log(" [✓] REVIEW SAMPLE VIDEO RENDERED SUCCESSFULLY!");
  console.log("================================================================");
  console.log(` File:        ${outFilename}`);
  console.log(` Size:        ${(stat.size / (1024 * 1024)).toFixed(2)} MB`);
  console.log(` Render Time: ${durationSec}s`);
  console.log(` Artifact:    ${artifactVideoPath}`);
  console.log(` Output:      ${repoVideoPath}`);
  console.log("================================================================\n");
}

main().catch((err) => {
  console.error("\n[✗] Video render failed:", err);
  process.exit(1);
});
