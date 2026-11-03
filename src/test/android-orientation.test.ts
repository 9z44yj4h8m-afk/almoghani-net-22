import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
describe("Android horizontal launch", () => {
  it("locks the launcher to either landscape orientation", () => {
    const manifest = readFileSync("android-app/app/src/main/AndroidManifest.xml", "utf8");
    expect(manifest.match(/android:screenOrientation="([^"]+)"/)?.[1]).toBe("sensorLandscape");
  });
  it("requests landscape for the installed web app", () => {
    const manifest = JSON.parse(readFileSync("public/manifest.webmanifest", "utf8"));
    expect(manifest.orientation).toBe("landscape");
  });
});