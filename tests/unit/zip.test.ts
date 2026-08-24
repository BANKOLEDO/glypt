import { describe, expect, it } from "vitest";
import { crc32, createZip } from "@glypt/core";

describe("crc32", () => {
  it("matches the canonical check vector", () => {
    // "123456789" -> 0xCBF43926 (CRC-32/ISO-HDLC)
    const data = new TextEncoder().encode("123456789");
    expect(crc32(data)).toBe(0xcbf43926);
  });

  it("returns 0 for empty input", () => {
    expect(crc32(new Uint8Array(0))).toBe(0);
  });
});

describe("createZip", () => {
  const enc = new TextEncoder();

  it("produces bytes with correct local header and EOCD signatures", () => {
    const zip = createZip([
      { name: "a.txt", data: enc.encode("hello") },
      { name: "dir/b.txt", data: enc.encode("world") },
    ]);

    expect(zip[0]).toBe(0x50); // P
    expect(zip[1]).toBe(0x4b); // K
    expect(zip[2]).toBe(0x03); // local file header
    expect(zip[3]).toBe(0x04);

    const eocdStart = zip.length - 22;
    expect(zip[eocdStart]).toBe(0x50);
    expect(zip[eocdStart + 1]).toBe(0x4b);
    expect(zip[eocdStart + 2]).toBe(0x05);
    expect(zip[eocdStart + 3]).toBe(0x06);
  });

  it("records the entry count in the EOCD", () => {
    const entries = [1, 2, 3].map((i) => ({
      name: `f${i}.svg`,
      data: enc.encode(`<svg>${i}</svg>`),
    }));
    const zip = createZip(entries);
    const dv = new DataView(zip.buffer, zip.length - 22, 22);
    expect(dv.getUint16(8, true)).toBe(3); // total entries
    expect(dv.getUint16(10, true)).toBe(3); // central dir entries
  });

  it("stores uncompressed content verbatim", () => {
    const payload = "<svg viewBox=\"0 0 24 24\"><path d=\"M3\"/></svg>";
    const zip = createZip([{ name: "icon.svg", data: enc.encode(payload) }]);
    const text = new TextDecoder().decode(zip);
    expect(text).toContain(payload);
    expect(text).toContain("icon.svg");
  });

  it("handles empty entry list", () => {
    const zip = createZip([]);
    expect(zip.length).toBe(22); // just the EOCD
  });
});
