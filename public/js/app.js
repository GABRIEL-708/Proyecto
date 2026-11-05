/**
 * Lógica Principal de TechField PWA (Semana 2)
 * Manejo del ciclo de vida PWA, instalación, IndexedDB, modo Offline y sincronización automática.
 */

let deferredPrompt = null;
let currentFilter = 'todos'; // 'todos' | 'pendientes' | 'sincronizados'

// Inicialización cuando carga el DOM
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Inicializar base de datos IndexedDB
    try {
        await TechFieldDB.abrirDB();
        console.log('[App] IndexedDB listo para almacenamiento offline.');
    } catch (e) {
        console.error('[App] Error al inicializar IndexedDB:', e);
    }

    // 2. Registrar Service Worker
    registrarServiceWorker();

    // 3. Monitoreo de conectividad (Online / Offline)
    actualizarEstadoConectividad();
    window.addEventListener('online', handleNetworkChange);
    window.addEventListener('offline', handleNetworkChange);

    // 4. Configurar eventos de instalación PWA
    configurarInstalacionPWA();

    // 5. Cargar reportes (híbrido: Local primero + sincronización remota si hay red)
    await cargarYRenderizarReportes();

    // 6. Configurar listeners de formularios y botones
    configurarEventosUI();
});

// ========================================================
// 1. REGISTRO DEL SERVICE WORKER
// ========================================================
function registrarServiceWorker() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js')
                .then((registration) => {
                    console.log('[App] Service Worker registrado con éxito. Scope:', registration.scope);

                    // Escuchar actualizaciones del SW
                    registration.onupdatefound = () => {
                        const installingWorker = registration.installing;
                        installingWorker.onstatechange = () => {
                            if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                showToast('Nueva versión de TechField disponible. Actualizada.');
                            }
                        };
                    };
                })
                .catch((err) => {
                    console.error('[App] Error registrando el Service Worker:', err);
                });

            // Escuchar mensajes provenientes del Service Worker (ej. Background Sync)
            navigator.serviceWorker.addEventListener('message', (event) => {
                if (event.data && event.data.tipo === 'EJECUTAR_SINCRONIZACION') {
                    console.log('[App] Mensaje del Service Worker: Sincronizando datos...');
                    sincronizarPendientes();
                }
            });
        });
    } else {
        console.warn('[App] Service Workers no soportados en este navegador.');
    }
}

// ========================================================
// 2. DETECCIÓN Y GESTIÓN DE CONECTIVIDAD (ONLINE / OFFLINE)
// ========================================================
function actualizarEstadoConectividad() {
    const isOnline = navigator.onLine;
    const pill = document.getElementById('netStatusPill');
    const label = document.getElementById('netStatusLabel');

    if (isOnline) {
        pill.className = 'net-pill online';
        label.innerText = 'En Línea (Conectado)';
    } else {
        pill.className = 'net-pill offline';
        label.innerText = 'Modo Campo (Sin Red)';
    }
}

async function handleNetworkChange() {
    actualizarEstadoConectividad();
    if (navigator.onLine) {
        showToast('📡 Conexión restablecida. Sincronizando reportes...', 'info');
        await sincronizarPendientes();
        await sincronizarDesdeServidor();
    } else {
        showToast('⚠️ Estás desconectado. TechField trabajará en modo Offline (IndexedDB).', 'warning');
    }
}

// ========================================================
// 3. EVENTOS DE INSTALACIÓN PWA (PROMPT NATIVO & SAFARI)
// ========================================================
function configurarInstalacionPWA() {
    const banner = document.getElementById('installBanner');
    const btnInstall = document.getElementById('btnInstallApp');
    const btnDismiss = document.getElementById('btnDismissBanner');
    const isIos = /iPhone|iPad|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;

    // Si ya está instalada, no mostrar banners
    if (isStandalone) {
        banner.style.display = 'none';
        return;
    }

    // Interceptar beforeinstallprompt (Chromium / Android / Desktop Edge)
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        banner.style.display = 'flex';
        console.log('[PWA] Evento beforeinstallprompt capturado.');
    });

    // Clic en botón "Instalar"
    btnInstall.addEventListener('click', async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`[PWA] Respuesta del usuario al instalar: ${outcome}`);
            deferredPrompt = null;
            banner.style.display = 'none';
        } else if (isIos) {
            // Mostrar guía para iOS Safari
            document.getElementById('iosModal').style.display = 'flex';
        } else {
            showToast('Para instalar: Pulsa los 3 puntos de tu navegador y elige "Instalar aplicación".', 'info');
        }
    });

    btnDismiss.addEventListener('click', () => {
        banner.style.display = 'none';
    });

    // Detectar instalación completada
    window.addEventListener('appinstalled', () => {
        banner.style.display = 'none';
        showToast('🎉 ¡TechField se ha instalado en tu pantalla de inicio!', 'success');
        console.log('[PWA] Aplicación instalada exitosamente.');
    });
}

// ========================================================
// 4. CAPTURA DE COORDENADAS GPS DEL SITIO
// ========================================================
function obtenerCoordenadasGPS() {
    const inputGps = document.getElementById('coordenadas');
    if (!('geolocation' in navigator)) {
        showToast('La geolocalización no está soportada en tu navegador', 'error');
        return;
    }

    inputGps.placeholder = 'Obteniendo satélites GPS...';
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const lat = position.coords.latitude.toFixed(5);
            const lng = position.coords.longitude.toFixed(5);
            inputGps.value = `${lat}, ${lng}`;
            showToast('📍 Coordenadas GPS fijadas correctamente');
        },
        (error) => {
            console.error('Error GPS:', error);
            inputGps.placeholder = 'Ej. 16.8924, -96.7214 (Manual)';
            showToast('No se pudo obtener el GPS: ' + error.message, 'warning');
        },
        { enableHighAccuracy: true, timeout: 8000 }
    );
}

// ========================================================
// 5. FLUJO DE PERSISTENCIA: OFFLINE-FIRST
// ========================================================

// Enviar / Guardar un nuevo reporte
async function procesarEnvioReporte(e) {
    e.preventDefault();

    const cliente = document.getElementById('cliente').value.trim();
    const tipoEquipo = document.getElementById('tipoEquipo').value.trim();
    const prioridad = document.getElementById('prioridad').value;
    const falla = document.getElementById('falla').value.trim();
    const diagnostico = document.getElementById('diagnostico').value.trim();
    const coordsStr = document.getElementById('coordenadas').value.trim();
    const tecnico = document.getElementById('tecnico').value.trim();

    if (!cliente || !tipoEquipo) {
        showToast('Por favor completa el Cliente y Tipo de Equipo', 'warning');
        return;
    }

    // Estructurar reporte
    const timestamp = new Date().toISOString();
    const tempId = `LOCAL-${Date.now().toString().slice(-6)}`;

    const nuevoReporte = {
        id: tempId,
        cliente,
        tipoEquipo,
        prioridad,
        falla,
        diagnostico,
        coordenadas: coordsStr || 'Sin registrar',
        tecnico: tecnico || 'Técnico UTM',
        fecha: timestamp,
        sincronizado: false,
        estado: 'Pendiente (Offline)'
    };

    // Si estamos en línea, intentar enviar directamente al servidor
    if (navigator.onLine) {
        try {
            const res = await fetch('/api/reportes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(nuevoReporte)
            });

            if (res.ok) {
                const resData = await res.json();
                const reporteCentral = resData.reporte;
                reporteCentral.sincronizado = true;
                reporteCentral.estado = 'Sincronizado';

                // Guardar copia local en IndexedDB marcada como sincronizada
                await TechFieldDB.guardarReporteLocal(reporteCentral);
                showToast('✓ Reporte enviado y sincronizado con el servidor central');
                limpiarFormulario();
                await cargarYRenderizarReportes();
                return;
            }
        } catch (err) {
            console.warn('[App] Falló petición de red directa, guardando localmente en IndexedDB...', err);
        }
    }

    // Modo Offline o si falló la red
    await TechFieldDB.guardarReporteLocal(nuevoReporte);
    showToast('💾 Sin red: Reporte guardado localmente en tu teléfono (IndexedDB)', 'warning');

    // Registrar sincronización en segundo plano si está disponible
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
        navigator.serviceWorker.ready.then((reg) => {
            return reg.sync.register('sync-reportes-tecnicos');
        }).catch((err) => console.log('SyncManager no disponible:', err));
    }

    limpiarFormulario();
    await cargarYRenderizarReportes();
}

function limpiarFormulario() {
    document.getElementById('formReporte').reset();
    document.getElementById('tecnico').value = 'Ing. Técnico UTM';
}

// ========================================================
// 6. SINCRONIZACIÓN DE REPORTES PENDIENTES
// ========================================================
async function sincronizarPendientes() {
    if (!navigator.onLine) {
        showToast('No es posible sincronizar: el dispositivo continúa sin red.', 'warning');
        return;
    }

    const pendientes = await TechFieldDB.obtenerReportesPendientes();
    if (pendientes.length === 0) {
        showToast('Todos los reportes locales ya están sincronizados', 'info');
        return;
    }

    const btnSync = document.getElementById('btnSync');
    btnSync.disabled = true;
    btnSync.innerHTML = '🔄 Sincronizando...';

    try {
        const res = await fetch('/api/reportes/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(pendientes)
        });

        if (!res.ok) throw new Error('Error en endpoint de sincronización');

        const resultado = await res.json();
        const sincronizados = resultado.sincronizados || [];

        // Marcar en IndexedDB
        for (const item of sincronizados) {
            await TechFieldDB.marcarReporteComoSincronizado(item.id, item);
        }

        showToast(`🎉 ¡${sincronizados.length} reporte(s) sincronizados exitosamente con la central!`, 'success');
        await cargarYRenderizarReportes();
    } catch (err) {
        console.error('Error sincronizando lotes:', err);
        showToast('Error sincronizando: ' + err.message, 'error');
    } finally {
        btnSync.disabled = false;
        btnSync.innerHTML = '🔄 Sincronizar Ahora';
    }
}

// Traer reportes centrales a la caché local cuando hay red
async function sincronizarDesdeServidor() {
    if (!navigator.onLine) return;
    try {
        const res = await fetch('/api/reportes');
        if (res.ok) {
            const remotos = await res.json();
            for (const r of remotos) {
                r.sincronizado = true;
                r.estado = 'Sincronizado';
                await TechFieldDB.guardarReporteLocal(r);
            }
        }
    } catch (err) {
        console.warn('No se pudo actualizar desde el servidor:', err);
    }
}

// ========================================================
// 7. RENDERIZADO DE LA INTERFAZ
// ========================================================
async function cargarYRenderizarReportes() {
    // 1. Obtener de IndexedDB (inmediato, sin latencia)
    let locales = await TechFieldDB.obtenerTodosReportesLocales();

    // 2. Si la base de datos local está vacía y hay conexión, consultar API inicial
    if (locales.length === 0 && navigator.onLine) {
        await sincronizarDesdeServidor();
        locales = await TechFieldDB.obtenerTodosReportesLocales();
    }

    // 3. Actualizar contador de pendientes
    const pendientes = locales.filter(r => r.sincronizado === false);
    const syncBadge = document.getElementById('syncBadge');
    const syncCount = document.getElementById('syncCount');

    syncCount.innerText = pendientes.length;
    if (pendientes.length > 0) {
        syncBadge.className = 'sync-badge has-pending';
    } else {
        syncBadge.className = 'sync-badge';
    }

    // 4. Filtrar según la pestaña activa
    let reportesAMostrar = locales;
    if (currentFilter === 'pendientes') {
        reportesAMostrar = locales.filter(r => r.sincronizado === false);
    } else if (currentFilter === 'sincronizados') {
        reportesAMostrar = locales.filter(r => r.sincronizado === true);
    }

    const container = document.getElementById('reportsContainer');

    if (reportesAMostrar.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 2.5rem 1rem; color: var(--text-secondary);">
                <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">📋</div>
                <p>No hay reportes en esta categoría.</p>
                <small style="color: var(--text-muted);">Los reportes que levantes en campo se guardarán automáticamente.</small>
            </div>
        `;
        return;
    }

    container.innerHTML = reportesAMostrar.map(r => {
        const isPending = !r.sincronizado;
        const cardClass = isPending ? 'report-card offline-pending' : 'report-card synced';
        const syncLabel = isPending ? '🟡 Pendiente (Offline)' : '✅ Sincronizado';
        const syncClass = isPending ? 'sync-state-tag pending' : 'sync-state-tag synced';

        return `
            <div class="${cardClass}" id="card-${r.id}">
                <div class="report-header">
                    <span class="folio-tag">${r.id}</span>
                    <div style="display: flex; gap: 0.35rem; align-items: center;">
                        <span class="${syncClass}">${syncLabel}</span>
                        <span class="priority-tag priority-${r.prioridad || 'Media'}">${r.prioridad || 'Media'}</span>
                    </div>
                </div>
                <div class="report-client">${escapeHtml(r.cliente)}</div>
                <div class="report-meta">🔧 <strong>Equipo:</strong> ${escapeHtml(r.tipoEquipo)}</div>
                ${r.coordenadas && r.coordenadas !== 'Sin registrar' ? `<div class="report-meta">📍 <strong>GPS:</strong> ${escapeHtml(r.coordenadas)}</div>` : ''}
                <div class="report-falla">⚠️ <strong>Falla:</strong> ${escapeHtml(r.falla || 'Sin detalles')}</div>
                ${r.diagnostico ? `<div class="report-meta" style="color: #38bdf8;">💡 <strong>Diagnóstico:</strong> ${escapeHtml(r.diagnostico)}</div>` : ''}
                <div class="report-footer">
                    <span>👤 ${escapeHtml(r.tecnico || 'N/A')} • 📅 ${new Date(r.fecha).toLocaleDateString()}</span>
                    <button class="btn-card-del" onclick="eliminarReporte('${r.id}')" title="Eliminar reporte">🗑️</button>
                </div>
            </div>
        `;
    }).join('');
}

// Eliminar reporte
async function eliminarReporte(id) {
    if (!confirm(`¿Deseas eliminar el reporte ${id}?`)) return;

    await TechFieldDB.eliminarReporteLocal(id);
    if (navigator.onLine && !id.startsWith('LOCAL-')) {
        fetch(`/api/reportes/${id}`, { method: 'DELETE' }).catch(() => {});
    }

    showToast(`Reporte ${id} eliminado`, 'info');
    await cargarYRenderizarReportes();
}

// ========================================================
// 8. CONFIGURACIÓN DE LISTENERS
// ========================================================
function configurarEventosUI() {
    // Formulario de envío
    document.getElementById('formReporte').addEventListener('submit', procesarEnvioReporte);

    // Botón GPS
    document.getElementById('btnGps').addEventListener('click', obtenerCoordenadasGPS);

    // Botón sincronizar ahora
    document.getElementById('btnSync').addEventListener('click', sincronizarPendientes);

    // Pestañas de filtrado
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            cargarYRenderizarReportes();
        });
    });

    // Cerrar modal iOS
    const closeIos = document.getElementById('btnCloseIos');
    if (closeIos) {
        closeIos.addEventListener('click', () => {
            document.getElementById('iosModal').style.display = 'none';
        });
    }
}

// ========================================================
// 9. UTILIDADES Y TOAST
// ========================================================
function showToast(mensaje, tipo = 'success') {
    const toast = document.getElementById('toast');
    toast.innerText = mensaje;
    if (tipo === 'warning') {
        toast.style.background = '#f59e0b';
        toast.style.color = '#000';
    } else if (tipo === 'error') {
        toast.style.background = '#ef4444';
        toast.style.color = '#fff';
    } else if (tipo === 'info') {
        toast.style.background = '#2563eb';
        toast.style.color = '#fff';
    } else {
        toast.style.background = '#10b981';
        toast.style.color = '#fff';
    }

    toast.style.display = 'block';
    setTimeout(() => {
        toast.style.display = 'none';
    }, 4000);
}

function escapeHtml(text) {
    if (!text) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.toString().replace(/[&<>"']/g, m => map[m]);
}
