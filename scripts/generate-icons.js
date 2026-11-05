// Generador de íconos PNG y SVG sin dependencias externas
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Tabla CRC32 estándar
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
        c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    crcTable[n] = c;
}

function crc32(buf) {
    let c = 0xFFFFFFFF;
    for (let i = 0; i < buf.length; i++) {
        c = crcTable[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
    }
    return (c ^ 0xFFFFFFFF) >>> 0;
}

function createChunk(type, data) {
    const typeBuf = Buffer.from(type, 'ascii');
    const lengthBuf = Buffer.alloc(4);
    lengthBuf.writeUInt32BE(data.length, 0);

    const crcBuf = Buffer.alloc(4);
    const toCrc = Buffer.concat([typeBuf, data]);
    crcBuf.writeUInt32BE(crc32(toCrc), 0);

    return Buffer.concat([lengthBuf, typeBuf, data, crcBuf]);
}

function createPng(width, height, isMaskable = false) {
    // RGBA scanlines
    const rawData = Buffer.alloc(height * (1 + width * 4));
    let offset = 0;

    const cx = width / 2;
    const cy = height / 2;
    const radius = isMaskable ? width * 0.48 : width * 0.44;

    for (let y = 0; y < height; y++) {
        rawData[offset++] = 0; // Filter type 0 (None)

        for (let x = 0; x < width; x++) {
            const dx = x - cx;
            const dy = y - cy;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // Fondo: Gradiente azul elegante (#0F172A a #2563EB)
            let r = 15 + Math.floor((x / width) * 20);
            let g = 23 + Math.floor((y / height) * 70);
            let b = 42 + Math.floor(((x + y) / (width + height)) * 190);
            let a = 255;

            // Borde exterior o forma redondeada
            if (!isMaskable) {
                // Squircle / Rounded rect
                const cornerR = width * 0.22;
                const innerX = Math.max(0, Math.abs(dx) - (width * 0.5 - cornerR));
                const innerY = Math.max(0, Math.abs(dy) - (height * 0.5 - cornerR));
                const cornerDist = Math.sqrt(innerX * innerX + innerY * innerY);
                if (cornerDist > cornerR) {
                    a = 0;
                }
            }

            if (a > 0) {
                // Dibujar emblema central (llave técnica y engrane estilizados)
                // Círculo del engrane
                const gearR = width * 0.24;
                const gearHole = width * 0.10;
                const inGear = dist < gearR && dist > gearHole;

                // Dientes del engrane (6 dientes)
                const angle = Math.atan2(dy, dx);
                const teeth = Math.sin(angle * 6);
                const isTooth = dist < gearR * 1.18 && dist >= gearR && teeth > 0.4;

                // Barra diagonal de la llave de tuercas
                const wrenchThick = width * 0.07;
                // Rotada 45 grados: x' = dx * cos - dy * sin
                const rotX = (dx + dy) * 0.7071;
                const rotY = (-dx + dy) * 0.7071;
                const isHandle = Math.abs(rotY) < wrenchThick && rotX > -gearR * 1.2 && rotX < gearR * 1.2;

                // Cabeza de la llave
                const headDist = Math.sqrt((rotX - gearR * 1.0) ** 2 + rotY ** 2);
                const isHead = headDist < width * 0.13;
                const isHeadHole = headDist < width * 0.05;

                // Relámpago central (simbolizando energía / servicio técnico activo)
                const isBolt = (Math.abs(dx + dy * 0.3) < width * 0.04 && Math.abs(dy) < width * 0.22);

                if ((inGear || isTooth) && !isBolt) {
                    // Color azul cian moderno (#38BDF8)
                    r = 56;
                    g = 189;
                    b = 248;
                } else if ((isHandle || isHead) && !isHeadHole) {
                    // Color ámbar de servicio (#F59E0B)
                    r = 245;
                    g = 158;
                    b = 11;
                } else if (isBolt) {
                    // Rayo blanco / amarillo brillante
                    r = 254;
                    g = 240;
                    b = 138;
                }
            }

            rawData[offset++] = r;
            rawData[offset++] = g;
            rawData[offset++] = b;
            rawData[offset++] = a;
        }
    }

    // PNG Header
    const sig = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

    // IHDR
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(width, 0);
    ihdr.writeUInt32BE(height, 4);
    ihdr[8] = 8; // bit depth
    ihdr[9] = 6; // color type RGBA
    ihdr[10] = 0; // compression
    ihdr[11] = 0; // filter
    ihdr[12] = 0; // interlace

    const ihdrChunk = createChunk('IHDR', ihdr);

    // IDAT
    const compressed = zlib.deflateSync(rawData);
    const idatChunk = createChunk('IDAT', compressed);

    // IEND
    const iendChunk = createChunk('IEND', Buffer.alloc(0));

    return Buffer.concat([sig, ihdrChunk, idatChunk, iendChunk]);
}

const iconsDir = path.join(__dirname, '..', 'public', 'icons');
fs.mkdirSync(iconsDir, { recursive: true });

// Generar PNG 192x192
const png192 = createPng(192, 192, false);
fs.writeFileSync(path.join(iconsDir, 'icon-192.png'), png192);
console.log('✓ Creado icon-192.png (' + png192.length + ' bytes)');

// Generar PNG 512x512
const png512 = createPng(512, 512, false);
fs.writeFileSync(path.join(iconsDir, 'icon-512.png'), png512);
console.log('✓ Creado icon-512.png (' + png512.length + ' bytes)');

// Generar PNG maskable 512x512
const pngMaskable = createPng(512, 512, true);
fs.writeFileSync(path.join(iconsDir, 'icon-maskable.png'), pngMaskable);
console.log('✓ Creado icon-maskable.png (' + pngMaskable.length + ' bytes)');

// Generar SVG
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#1e40af"/>
    </linearGradient>
    <linearGradient id="wrench" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f59e0b"/>
      <stop offset="100%" stop-color="#d97706"/>
    </linearGradient>
    <linearGradient id="gear" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8"/>
      <stop offset="100%" stop-color="#0284c7"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="110" fill="url(#bg)"/>
  <circle cx="256" cy="256" r="140" fill="none" stroke="url(#gear)" stroke-width="26" stroke-dasharray="24 16"/>
  <circle cx="256" cy="256" r="60" fill="none" stroke="url(#gear)" stroke-width="18"/>
  <path d="M190 322 L322 190 M310 178 L334 202" stroke="url(#wrench)" stroke-width="32" stroke-linecap="round"/>
  <path d="M236 170 L286 240 L256 250 L276 342 L226 272 L256 262 Z" fill="#fef08a"/>
</svg>`;
fs.writeFileSync(path.join(iconsDir, 'icon.svg'), svg);
console.log('✓ Creado icon.svg');
