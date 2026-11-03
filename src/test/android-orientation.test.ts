import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
describe("Android horizontal launch", () => {
  it("opens the approved atlas design from the site and Android", () => {
    const route = readFileSync("src/routes/index.tsx", "utf8");
    const activity = readFileSync("android-app/app/src/main/java/net/almoghani/live/MainActivity.java", "utf8");
    expect(route.match(/href: "([^"]+)"/)?.[1]).toBe("/atlas.html");
    expect(activity.match(/HOME_URL = "([^"]+)"/)?.[1]).toBe("https://almoghani-net-22.lovable.app/atlas.html");
  });
  it("locks the launcher to either landscape orientation", () => {
    const manifest = readFileSync("android-app/app/src/main/AndroidManifest.xml", "utf8");
    expect(manifest.match(/android:screenOrientation="([^"]+)"/)?.[1]).toBe("sensorLandscape");
  });
  it("requests landscape for the installed web app", () => {
    const manifest = JSON.parse(readFileSync("public/manifest.webmanifest", "utf8"));
    expect(manifest.orientation).toBe("landscape");
  });
});