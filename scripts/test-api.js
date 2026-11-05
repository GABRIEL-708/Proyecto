const http = require('http');

// Ejecutar prueba importando la lógica o haciendo fetch a localhost
async function test() {
    console.log('--- Iniciando prueba de endpoints API Semana 1 ---');
    
    // Iniciar server
    require('../server.js');
    
    // Esperar a que escuche
    await new Promise(r => setTimeout(r, 600));

    // Probar GET /api/health
    const testHealth = await new Promise((resolve, reject) => {
        http.get('http://127.0.0.1:3000/api/health', (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(JSON.parse(data)));
        }).on('error', reject);
    });
    console.log('✓ GET /api/health responde:', testHealth.status);

    // Probar GET /api/reportes
    const testGet = await new Promise((resolve, reject) => {
        http.get('http://127.0.0.1:3000/api/reportes', (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(JSON.parse(data)));
        }).on('error', reject);
    });
    console.log('✓ GET /api/reportes devuelve:', testGet.length, 'reportes iniciales');

    // Probar POST /api/reportes
    const nuevo = JSON.stringify({
        cliente: 'Rancho Experimental UTM',
        tipoEquipo: 'Arrancador Suave 30HP',
        prioridad: 'Media',
        falla: 'Prueba de validación de API Semana 1',
        tecnico: 'Alumno UTM'
    });

    const testPost = await new Promise((resolve, reject) => {
        const req = http.request('http://127.0.0.1:3000/api/reportes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(nuevo)
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(JSON.parse(data)));
        });
        req.on('error', reject);
        req.write(nuevo);
        req.end();
    });
    console.log('✓ POST /api/reportes inserta:', testPost.reporte.id, '-', testPost.reporte.cliente);

    console.log('--- Todas las pruebas de la API pasaron con éxito ---');
    process.exit(0);
}

test().catch(err => {
    console.error('Error en prueba:', err);
    process.exit(1);
});

