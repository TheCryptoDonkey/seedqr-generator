import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { inflateSync } from "node:zlib";
import { decode } from "@forgesworn/qr";
import { standardPayload, compactPayload, encodeSeedQr, toPng, MARGIN, SCALE } from "../seedqr.js";

// Fixtures were produced by the previous encoder (npm qrcode 1.5.3, byte mode,
// error correction L) from public BIP39 test vectors. No real seed is used here.
const cases = JSON.parse(readFileSync(new URL("./old-encoder-matrices.json", import.meta.url), "utf8"));

for (const c of cases) {
    const words = c.words.split(" ");
    const payloads = { standard: standardPayload(words), compact: compactPayload(words) };
    for (const format of ["standard", "compact"]) {
        const want = c[format];
        test(`${format} SeedQR matches the previous encoder: ${words.length} words, ${words[0]}...${words.at(-1)}`, () => {
            const qr = encodeSeedQr(payloads[format]);
            assert.equal(qr.mode, "byte");
            assert.equal(qr.ecc, want.ecc);
            assert.equal(qr.version, want.version);
            assert.equal(qr.size, want.size);
            assert.equal(qr.mask, want.mask);
            assert.equal(Buffer.from(qr.modules).toString("hex"), want.modules);
        });
    }

    test(`PNG output reads back: ${words.length} words, ${words[0]}...${words.at(-1)}`, () => {
        for (const format of ["standard", "compact"]) {
            const qr = encodeSeedQr(payloads[format]);
            const png = toPng(qr);
            const side = (qr.size + MARGIN * 2) * SCALE;
            assert.equal(png.readUInt32BE(16), side);
            assert.equal(png.readUInt32BE(20), side);
            // read the single IDAT back to RGBA and decode it
            const idatLen = png.readUInt32BE(33);
            const raw = inflateSync(png.subarray(41, 41 + idatLen));
            const rgba = new Uint8ClampedArray(side * side * 4);
            for (let y = 0; y < side; y++) {
                rgba.set(raw.subarray(y * (side * 4 + 1) + 1, (y + 1) * (side * 4 + 1)), y * side * 4);
            }
            const found = decode({ data: rgba, width: side, height: side });
            assert.ok(found, `${format} decodes`);
            if (format === "standard") assert.equal(found.text, payloads.standard);
            else assert.deepEqual([...found.bytes], [...payloads.compact]);
        }
    });
}
