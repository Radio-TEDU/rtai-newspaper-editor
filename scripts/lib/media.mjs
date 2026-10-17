import { deflateSync } from 'node:zlib';

export function imageInfo(bytes) {
    const b = Buffer.from(bytes);
    let type, width, height;
    if (b.length >= 24 && b.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])) && b.toString('ascii', 12, 16) === 'IHDR') {
        type = 'image/png'; width = b.readUInt32BE(16); height = b.readUInt32BE(20);
    } else if (b.length >= 10 && /^GIF8[79]a$/.test(b.toString('ascii', 0, 6))) {
        type = 'image/gif'; width = b.readUInt16LE(6); height = b.readUInt16LE(8);
    } else if (b.length >= 30 && b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP') {
        type = 'image/webp'; const format = b.toString('ascii', 12, 16);
        if (format === 'VP8X') { width = b.readUIntLE(24, 3) + 1; height = b.readUIntLE(27, 3) + 1; }
        else if (format === 'VP8 ' && b.subarray(23, 26).equals(Buffer.from([157,1,42]))) { width = b.readUInt16LE(26) & 0x3fff; height = b.readUInt16LE(28) & 0x3fff; }
        else if (format === 'VP8L' && b[20] === 47) { const bits = b.readUInt32LE(21); width = (bits & 0x3fff) + 1; height = ((bits >>> 14) & 0x3fff) + 1; }
    } else if (b.length >= 4 && b[0] === 255 && b[1] === 216) {
        type = 'image/jpeg'; let pos = 2;
        while (pos + 4 < b.length) {
            if (b[pos++] !== 255) break;
            while (b[pos] === 255) pos++;
            const marker = b[pos++];
            if (marker === 217 || marker === 218) break;
            if (marker === 1 || marker >= 208 && marker <= 215) continue;
            if (pos + 2 > b.length) break;
            const length = b.readUInt16BE(pos);
            if (length < 2 || pos + length > b.length) break;
            if ([192,193,194,195,197,198,199,201,202,203,205,206,207].includes(marker) && length >= 7) { height = b.readUInt16BE(pos + 3); width = b.readUInt16BE(pos + 5); break; }
            pos += length;
        }
    }
    if (!type || !width || !height) throw new Error('Görsel başlığı okunamadı. PNG, JPEG, WebP veya GIF kullanın.');
    if (b.length > 20 * 1024 * 1024 || width * height > 32000000) throw new Error('Görsel sınırı: 20 MB / 32 megapiksel.');
    return { type, width, height };
}
function crc32(bytes) { let crc = 0xffffffff; for (const byte of bytes) { crc ^= byte; for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0); } return (crc ^ 0xffffffff) >>> 0; }
function chunk(name, data) { const type = Buffer.from(name), size = Buffer.alloc(4), crc = Buffer.alloc(4); size.writeUInt32BE(data.length); crc.writeUInt32BE(crc32(Buffer.concat([type, data]))); return Buffer.concat([size, type, data, crc]); }
export function demoImage() {
    const width = 640, height = 360, raw = Buffer.alloc((width * 3 + 1) * height);
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
        const pixel = y * (width * 3 + 1) + 1 + x * 3;
        const color = (x - 490) ** 2 + (y - 120) ** 2 < 65 ** 2 ? [201,65,49] : y > 130 && (x > 50 && x < 190 || x > 230 && x < 340) ? [33,77,68] : [218,226,204];
        raw.set(color, pixel);
    }
    const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(width); ihdr.writeUInt32BE(height, 4); ihdr[8] = 8; ihdr[9] = 2;
    return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}
