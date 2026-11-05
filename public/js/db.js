/**
 * Capa de Persistencia Local con IndexedDB para TechField PWA
 * Permite almacenar reportes en el dispositivo móvil del técnico cuando no hay conexión a internet.
 */

const DB_NAME = 'techfield_db';
const DB_VERSION = 1;
const STORE_NAME = 'reportes';

let dbInstance = null;

// Inicializar la base de datos IndexedDB
function abrirDB() {
    return new Promise((resolve, reject) => {
        if (dbInstance) {
            resolve(dbInstance);
            return;
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                store.createIndex('sincronizado', 'sincronizado', { unique: false });
                store.createIndex('fecha', 'fecha', { unique: false });
                store.createIndex('cliente', 'cliente', { unique: false });
                console.log('[IndexedDB] Almacén de objetos "reportes" e índices creados con éxito.');
            }
        };

        request.onsuccess = (event) => {
            dbInstance = event.target.result;
            console.log('[IndexedDB] Base de datos conectada correctamente.');
            resolve(dbInstance);
        };

        request.onerror = (event) => {
            console.error('[IndexedDB] Error abriendo la base de datos:', event.target.error);
            reject(event.target.error);
        };
    });
}

// Guardar o actualizar un reporte en IndexedDB
async function guardarReporteLocal(reporte) {
    const db = await abrirDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(reporte);

        request.onsuccess = () => {
            console.log(`[IndexedDB] Reporte ${reporte.id} guardado localmente.`);
            resolve(reporte);
        };

        request.onerror = (event) => {
            console.error('[IndexedDB] Error guardando reporte:', event.target.error);
            reject(event.target.error);
        };
    });
}

// Obtener todos los reportes guardados en IndexedDB
async function obtenerTodosReportesLocales() {
    const db = await abrirDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => {
            // Ordenar por fecha descendente (los más recientes primero)
            const reportes = (request.result || []).sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
            resolve(reportes);
        };

        request.onerror = (event) => {
            console.error('[IndexedDB] Error obteniendo reportes locales:', event.target.error);
            reject(event.target.error);
        };
    });
}

// Obtener únicamente los reportes pendientes de sincronizar (sincronizado === false)
async function obtenerReportesPendientes() {
    const db = await abrirDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => {
            const pendientes = (request.result || []).filter(r => r.sincronizado === false || r.estado === 'Pendiente (Offline)');
            resolve(pendientes);
        };

        request.onerror = (event) => {
            console.error('[IndexedDB] Error obteniendo reportes pendientes:', event.target.error);
            reject(event.target.error);
        };
    });
}

// Marcar un reporte como sincronizado con el servidor central
async function marcarReporteComoSincronizado(id, datosServidor = {}) {
    const db = await abrirDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const getRequest = store.get(id);

        getRequest.onsuccess = () => {
            const reporte = getRequest.result;
            if (!reporte) {
                resolve(null);
                return;
            }

            reporte.sincronizado = true;
            reporte.estado = 'Sincronizado';
            reporte.sincronizadoEn = new Date().toISOString();
            if (datosServidor.id && datosServidor.id !== id) {
                reporte.idCentral = datosServidor.id;
            }

            const putRequest = store.put(reporte);
            putRequest.onsuccess = () => resolve(reporte);
            putRequest.onerror = (e) => reject(e.target.error);
        };

        getRequest.onerror = (e) => reject(e.target.error);
    });
}

// Eliminar un reporte local
async function eliminarReporteLocal(id) {
    const db = await abrirDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(id);

        request.onsuccess = () => resolve(true);
        request.onerror = (e) => reject(e.target.error);
    });
}

// Contar reportes pendientes de envío
async function contarReportesPendientes() {
    const pendientes = await obtenerReportesPendientes();
    return pendientes.length;
}

// Exportar funciones globalmente en ventana del navegador
window.TechFieldDB = {
    abrirDB,
    guardarReporteLocal,
    obtenerTodosReportesLocales,
    obtenerReportesPendientes,
    marcarReporteComoSincronizado,
    eliminarReporteLocal,
    contarReportesPendientes
};
