import { continueRender, delayRender, staticFile } from "remotion";

let loaded = false;

export const ensureFontsLoaded = () => {
  if (loaded || typeof document === "undefined") return;
  loaded = true;
  const handle = delayRender("Loading Lincoln Penny custom fonts");

  const defs = [
    { family: "Fraunces", file: "fonts/Fraunces.ttf", weight: "700" },
    { family: "Archivo", file: "fonts/Archivo.ttf", weight: "400 900" },
    { family: "PlexMono", file: "fonts/IBMPlexMono-SemiBold.ttf", weight: "600" },
    { family: "Caveat", file: "fonts/Caveat.ttf", weight: "700" },
  ];

  Promise.all(
    defs.map(async (d) => {
      const face = new FontFace(d.family, `url(${staticFile(d.file)})`, {
        weight: d.weight,
      });
      const loadedFace = await face.load();
      document.fonts.add(loadedFace);
    })
  )
    .then(() => continueRender(handle))
    .catch((err) => {
      console.warn("Font fallback warning:", err);
      continueRender(handle);
    });
};

if (typeof document !== "undefined") {
  ensureFontsLoaded();
}

export const FONTS = {
  display: "'Fraunces', Georgia, serif",
  serif: "'Fraunces', Georgia, serif",
  sans: "'Archivo', 'Segoe UI', sans-serif",
  body: "'Archivo', 'Segoe UI', sans-serif",
  mono: "'PlexMono', Consolas, monospace",
  hand: "'Caveat', cursive",
};
