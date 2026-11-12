const path = require("path");
const fs = require("fs");
const { bundle } = require("@remotion/bundler");
const { getCompositions, renderStill } = require("@remotion/renderer");

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const ARTIFACTS_DIR = "C:\\Users\\pc\\.gemini\\antigravity\\brain\\4ad00f23-0ef8-4957-944f-f262bbae8fb5";

async function main() {
  console.log("Bundling motion-engine Root entrypoint...");
  const entry = path.resolve(__dirname, "../src/index.ts");
  const bundleLocation = await bundle({
    entryPoint: entry,
    webpackOverride: (config) => config,
  });
  console.log("Bundle created at:", bundleLocation);

  const comps = await getCompositions(bundleLocation, {
    browserExecutable: CHROME_PATH,
  });

  const costcoComp = comps.find((c) => c.id === "CostcoHotdogShort" || c.id === "DirectedPodcastScene");
  if (!costcoComp) {
    throw new Error("Could not find CostcoHotdogShort or DirectedPodcastScene composition!");
  }
  console.log(`Found target composition: ${costcoComp.id} (${costcoComp.width}x${costcoComp.height}, ${costcoComp.durationInFrames} frames)`);

  const proofTargets = [
    { frame: 130, label: "costco_proof1_host_curious_f130.png", desc: "Gate 1: Host curious inquiry ('Charges them how?') with chibi hoodie & chin-listen pose" },
    { frame: 560, label: "costco_proof2_deadpan_silence_hold_f560.png", desc: "Gate 2: Comedic 2.0s deadpan silence hold ('Millions of them') both looking at camera" },
    { frame: 980, label: "costco_proof3_punchline_smirk_f980.png", desc: "Gate 3: Host punchline payoff ('That\\'s what I\\'m working on') looking at camera with smirk" },
    { frame: 1300, label: "costco_proof4_evidence_revelation_f1300.png", desc: "Gate 4: Evidence revelation ($4.8B membership fee cash flow & 52% operating profit card)" },
  ];

  for (const target of proofTargets) {
    const outPath = path.join(ARTIFACTS_DIR, target.label);
    console.log(`Rendering ${target.label} at frame ${target.frame}...`);
    await renderStill({
      composition: costcoComp,
      serveUrl: bundleLocation,
      output: outPath,
      frame: target.frame,
      browserExecutable: CHROME_PATH,
      imageFormat: "png",
    });
    console.log(`[OK] Saved ${target.label} (${fs.statSync(outPath).size} bytes)`);
  }

  console.log("\nALL COSTCO EPISODE VISUAL PROOFS RENDERED SUCCESSFULLY!");
}

main().catch((err) => {
  console.error("Render failed:", err);
  process.exit(1);
});
