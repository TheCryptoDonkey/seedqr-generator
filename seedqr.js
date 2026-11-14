import * as bip39 from "bip39";
import { deflateSync } from "node:zlib";
import { encode } from "@forgesworn/qr";

// Both formats are encoded in byte mode at error correction level L, with the
// smallest version that fits. These are the settings the tool has always used.
export const ECC = "L";
export const MODE = "byte";
export const MARGIN = 4;  // quiet zone, in modules
export const SCALE = 10;  // pixels per module

export function getWordIndex(word) {
    const wordlist = bip39.wordlists.english;
    const index = wordlist.indexOf(word);
    // needs to be zero padded to 4 digits
    return index.toString().padStart(4, '0');
}

export function indexToBinary(index) {
    if (index < 0) {
        return null;
    }
    return index.toString(2).padStart(11, '0');  // Convert to binary and pad to 11 bits
}

// Standard SeedQR payload: four decimal digits per word, joined.
export function standardPayload(words) {
    return words.map(word => getWordIndex(word)).join('');
}

// CompactSeedQR payload: the entropy bytes (word indices as 11-bit groups,
// checksum bits dropped). Returns null for a word count other than 12 or 24.
export function compactPayload(words) {
    const binaryStream = words
        .map(word => indexToBinary(parseInt(getWordIndex(word))))
        .join('');

    // if we are using 12 words we need to remove 4 bits from the end, if 24 then 8
    let checksumLength;
    if (binaryStream.length == 132) {
        checksumLength = 4;
    } else if (binaryStream.length == 264) {
        checksumLength = 8;
    } else {
        return null;
    }
    const binaryStreamWithoutChecksum = binaryStream.slice(0, -checksumLength);

    const byteStream = [];
    for (let i = 0; i < binaryStreamWithoutChecksum.length; i += 8) {
        byteStream.push(parseInt(binaryStreamWithoutChecksum.slice(i, i + 8), 2));
    }
    return new Uint8Array(byteStream);
}

export function encodeSeedQr(data) {
    return encode(data, { ecc: ECC, mode: MODE });
}

// PNG bytes for a QR symbol: black on white, MARGIN modules of quiet zone,
// SCALE pixels per module, 8-bit RGBA.
export function toPng(qr, { margin = MARGIN, scale = SCALE } = {}) {
    const side = (qr.size + margin * 2) * scale;
    const stride = side * 4 + 1;
    const raw = Buffer.alloc(stride * side, 0xff);
    for (let y = 0; y < side; y++) {
        raw[y * stride] = 0; // filter: none
        const my = Math.floor(y / scale) - margin;
        for (let x = 0; x < side; x++) {
            const mx = Math.floor(x / scale) - margin;
            const dark = my >= 0 && my < qr.size && mx >= 0 && mx < qr.size
                && qr.modules[my * qr.size + mx] === 1;
            if (dark) {
                const o = y * stride + 1 + x * 4;
                raw[o] = raw[o + 1] = raw[o + 2] = 0; // alpha stays 255
            }
        }
    }
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(side, 0);
    ihdr.writeUInt32BE(side, 4);
    ihdr[8] = 8; // bit depth
    ihdr[9] = 6; // colour type: RGBA
    return Buffer.concat([
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
        chunk("IHDR", ihdr),
        chunk("IDAT", deflateSync(raw)),
        chunk("IEND", Buffer.alloc(0)),
    ]);
}

function chunk(type, data) {
    const out = Buffer.alloc(12 + data.length);
    out.writeUInt32BE(data.length, 0);
    out.write(type, 4, "latin1");
    data.copy(out, 8);
    out.writeUInt32BE(crc32(out.subarray(4, 8 + data.length)), 8 + data.length);
    return out;
}

const CRC_TABLE = Uint32Array.from({ length: 256 }, (_, n) => {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
});

function crc32(buf) {
    let c = 0xffffffff;
    for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
}
