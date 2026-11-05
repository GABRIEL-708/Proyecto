/**
 * Servidor Web y API REST para TechField PWA
 * Construido con Node.js estándar (sin dependencias externas)
 * Semana 1: Servidor HTTP, API REST y Persistencia en JSON
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'reportes.json');

// Asegurar que exista la carpeta de datos y archivo inicial
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

if (!fs.existsSync(DATA_FILE)) {
    const semillaInicial = [
        {
            id: 'REP-2026-001',
            cliente: 'Rancho Santa María',
            contacto: '+52 951 123 4567',
            tipoEquipo: 'Bomba de Riego Sumergible 5HP',
            numeroSerie: 'BRS-8842-X',
            prioridad: 'Alta',
            estado: 'Sincronizado',
            falla: 'Disparo constante de protección térmica en arrancador magnético.',
            diagnostico: 'Bobinado recalentado por fluctuación de voltaje en línea monofásica.',
            coordenadas: { latitud: 16.8924, longitud: -96.7214 },
            tecnico: 'Ing. Carlos Mendoza',
            fecha: '2026-10-24T14:30:00.000Z',
            sincronizadoEn: '2026-10-24T14:30:00.000Z'
        },
        {
            id: 'REP-2026-002',
            cliente: 'Cooperativa Agrícola El Valle',
            contacto: '+52 951 987 6543',
            tipoEquipo: 'Generador Diésel Trifásico 20kW',
            numeroSerie: 'GEN-5510-D',
            prioridad: 'Urgente',
            estado: 'Sincronizado',
            falla: 'Fuga de combustible en línea de inyección número 2 y bajo voltaje de salida.',
            diagnostico: 'O-ring de sello fracturado y regulador AVR descalibrado.',
            coordenadas: { latitud: 16.9150, longitud: -96.6890 },
            tecnico: 'Ing. María Fernanda Ruiz',
            fecha: '2026-10-25T10:15:00.000Z',
            sincronizadoEn: '2026-10-25T10:15:00.000Z'
        }
    ];
    fs.writeFileSync(DATA_FILE, JSON.stringify(semillaInicial, null, 2), 'utf8');
}

// Mapa de tipos MIME
const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.webmanifest': 'application/manifest+json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.txt': 'text/plain; charset=utf-8'
};

// Lectura de reportes
function leerReportes() {
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(data || '[]');
    } catch (err) {
        console.error('Error leyendo reportes:', err.message);
        return [];
    }
}

// Escritura de reportes
function guardarReportes(reportes) {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(reportes, null, 2), 'utf8');
        return true;
    } catch (err) {
        console.error('Error guardando en archivo reportes.json:', err.message);
        return false;
    }
}

// Configurar encabezados CORS y Preflight
function setCorsHeaders(res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, X-Requested-With');
}

// Servidor HTTP Principal
const server = http.createServer((req, res) => {
    setCorsHeaders(res);

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    const parsedUrl = url.parse(req.url, true);
    const rawPath = parsedUrl.pathname || '/';
    // Normalizar: remover trailing slashes (/api/reportes/ -> /api/reportes)
    const pathname = (rawPath.length > 1 && rawPath.endsWith('/')) ? rawPath.slice(0, -1) : rawPath;

    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${pathname}`);

    // ==========================================
    // API REST ENDPOINTS
    // ==========================================

    // 1. Healthcheck
    if (pathname === '/api/health' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            status: 'ok',
            servicio: 'TechField PWA Backend API',
            version: '1.0.0',
            uptime: process.uptime(),
            timestamp: new Date().toISOString()
        }));
        return;
    }

    // 2. Listar reportes (GET /api/reportes)
    if (pathname === '/api/reportes' && req.method === 'GET') {
        const reportes = leerReportes();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(reportes));
        return;
    }

    // 3. Crear un reporte (POST /api/reportes)
    if (pathname === '/api/reportes' && req.method === 'POST') {
        req.setEncoding('utf8');
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                if (!body || !body.trim()) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Cuerpo de solicitud vacío' }));
                    return;
                }

                const nuevoReporte = JSON.parse(body);
                const reportes = leerReportes();

                // Validaciones de negocio
                if (!nuevoReporte.cliente || !nuevoReporte.tipoEquipo) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Los campos "cliente" y "tipoEquipo" son obligatorios' }));
                    return;
                }

                // Generar Folio único
                const consecutivo = reportes.length + 1;
                const id = nuevoReporte.id || `REP-${new Date().getFullYear()}-${String(consecutivo).padStart(3, '0')}`;
                
                const reporteCompleto = {
                    ...nuevoReporte,
                    id,
                    estado: 'Sincronizado',
                    fecha: nuevoReporte.fecha || new Date().toISOString(),
                    sincronizadoEn: new Date().toISOString()
                };

                // Si ya existe por id, actualizar; si no, agregar al inicio
                const index = reportes.findIndex(r => r.id === id);
                if (index >= 0) {
                    reportes[index] = reporteCompleto;
                } else {
                    reportes.unshift(reporteCompleto);
                }

                const ok = guardarReportes(reportes);
                if (!ok) {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Error del servidor al escribir en disco' }));
                    return;
                }

                console.log(`✓ [Reporte Creado]: ${id} - ${reporteCompleto.cliente} (${reporteCompleto.tipoEquipo})`);

                res.writeHead(201, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    mensaje: 'Reporte guardado exitosamente en el servidor central',
                    reporte: reporteCompleto
                }));
            } catch (err) {
                console.error('[Error procesando POST /api/reportes]:', err.message);
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'JSON inválido: ' + err.message }));
            }
        });
        return;
    }

    // 4. Sincronización por lotes (POST /api/reportes/sync)
    if (pathname === '/api/reportes/sync' && req.method === 'POST') {
        req.setEncoding('utf8');
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                const lotes = JSON.parse(body || '[]');
                if (!Array.isArray(lotes)) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Se esperaba un arreglo de reportes' }));
                    return;
                }

                const reportes = leerReportes();
                const sincronizados = [];

                for (const item of lotes) {
                    const id = item.id || `REP-${new Date().getFullYear()}-${String(reportes.length + 1).padStart(3, '0')}`;
                    const repFinal = {
                        ...item,
                        id,
                        estado: 'Sincronizado',
                        sincronizadoEn: new Date().toISOString()
                    };

                    const idx = reportes.findIndex(r => r.id === id);
                    if (idx >= 0) {
                        reportes[idx] = repFinal;
                    } else {
                        reportes.unshift(repFinal);
                    }
                    sincronizados.push(repFinal);
                }

                guardarReportes(reportes);

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    mensaje: `${sincronizados.length} reportes sincronizados correctamente`,
                    sincronizados
                }));
            } catch (err) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Error procesando lote de sincronización' }));
            }
        });
        return;
    }

    // 5. Eliminar reporte para pruebas (DELETE /api/reportes/:id)
    if (pathname.startsWith('/api/reportes/') && req.method === 'DELETE') {
        const idToDelete = decodeURIComponent(pathname.replace('/api/reportes/', ''));
        const reportes = leerReportes();
        const filtrados = reportes.filter(r => r.id !== idToDelete);

        if (filtrados.length === reportes.length) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Reporte no encontrado' }));
            return;
        }

        guardarReportes(filtrados);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ mensaje: 'Reporte eliminado correctamente' }));
        return;
    }

    // Si la ruta inicia con /api/ y no coincidió con ningún endpoint, devolver 404 JSON (no HTML)
    if (pathname.startsWith('/api/')) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: `Endpoint no encontrado: ${req.method} ${pathname}` }));
        return;
    }

    // ==========================================
    // SERVIDOR DE ARCHIVOS ESTÁTICOS
    // ==========================================
    let reqPath = pathname === '/' ? '/index.html' : pathname;
    const safePath = path.normalize(reqPath).replace(/^(\.\.[\/\\])+/, '');
    let filePath = path.join(PUBLIC_DIR, safePath);

    fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
            const acceptHeader = req.headers['accept'] || '';
            if (acceptHeader.includes('text/html')) {
                filePath = path.join(PUBLIC_DIR, 'index.html');
            } else {
                res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
                res.end('404 Recurso No Encontrado');
                return;
            }
        }

        const ext = path.extname(filePath).toLowerCase();
        const baseName = path.basename(filePath);
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';

        if (baseName === 'sw.js') {
            res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
            res.setHeader('Service-Worker-Allowed', '/');
        } else if (baseName === 'manifest.json') {
            res.setHeader('Content-Type', 'application/manifest+json; charset=utf-8');
            res.setHeader('Cache-Control', 'no-cache, max-age=0');
        } else {
            res.setHeader('Cache-Control', 'no-cache, max-age=0');
        }

        res.writeHead(200, { 'Content-Type': contentType });
        const stream = fs.createReadStream(filePath);
        stream.pipe(res);
    });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`=======================================================`);
    console.log(`🚀 Servidor TechField PWA iniciado`);
    console.log(`📡 URL Local:      http://localhost:${PORT}`);
    console.log(`⚙️  API REST:       http://localhost:${PORT}/api/reportes`);
    console.log(`💓 Healthcheck:    http://localhost:${PORT}/api/health`);
    console.log(`📱 PWA Frontend:   http://localhost:${PORT}/`);
    console.log(`=======================================================`);
});
