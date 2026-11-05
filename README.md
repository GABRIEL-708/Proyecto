# 🚀 TechField PWA - Sistema de Reportes Técnicos en Campo
### Proyecto Integrador: Fundamentos y Escenarios de Uso de las Aplicaciones Web Progresivas (PWA)
**Universidad Tecnológica Metropolitana (UTM) • 10° Cuatrimestre**

---

## 🌟 Descripción General

**TechField** es una Aplicación Web Progresiva (PWA) de nivel profesional diseñada para técnicos de mantenimiento electromecánico y agrícola que trabajan en zonas rurales sin cobertura de internet (zonas blancas). 

La aplicación opera bajo una arquitectura **Offline-First**:
* Permite crear y consultar reportes técnicos con geolocalización GPS aun con el dispositivo en **Modo Avión** gracias a **IndexedDB** y a la intercepción de red de un **Service Worker**.
* Al recuperar la señal de internet, los reportes guardados en el teléfono se **sincronizan automáticamente** con la oficina central a través de una **API REST desacoplada**.
* Es 100% instalable en smartphones (Android WebAPK, iPhone Safari Home Screen) y escritorios (Chrome / Edge standalone).

---

## 🛠️ Stack Tecnológico

* **Frontend:** HTML5 Semántico, CSS3 Responsivo (Mobile-First, Dark Theme), JavaScript Vanilla (ES6+).
* **Core PWA:** Web App Manifest (`manifest.json`), Service Worker (`sw.js`) con ciclo de vida completo (`install`, `activate`, `fetch`, `sync`), Cache Storage (Stale-While-Revalidate, Network-First, Cache-First).
* **Persistencia Local Offline:** IndexedDB (`techfield_db` con Object Store transaccional).
* **Backend y API REST:** Servidor nativo en Node.js sin dependencias externas (`server.js`).
* **Persistencia Central:** Almacenamiento JSON (`data/reportes.json`).
* **Despliegue y Pruebas Seguras:** Soporte de certificados SSL automáticos con Vercel (`vercel.json`), Netlify (`netlify.toml`), Ngrok y LocalTunnel.

---

## 🏁 Cómo Arrancar y Probar el Proyecto

### 1. Iniciar el Servidor Local
Abre una terminal en la carpeta del proyecto y ejecuta:
```bash
node server.js
```
*(o `npm start`)*

Verás el mensaje de confirmación:
```text
=======================================================
🚀 Servidor TechField PWA iniciado
📡 URL Local:      http://localhost:3000
⚙️  API REST:       http://localhost:3000/api/reportes
💓 Healthcheck:    http://localhost:3000/api/health
📱 PWA Frontend:   http://localhost:3000/
=======================================================
```

---

### 2. Abrir la Aplicación
Abre tu navegador (Chrome o Edge) e ingresa a:
👉 **[http://localhost:3000](http://localhost:3000)**

---

### 3. Cómo Probar el Modo Offline ("Modo Avión")
Esta es la prueba más importante para la demostración ante tu profesor:

1. Abre las herramientas de desarrollo de tu navegador presionando **`F12`** o clic derecho -> **Inspeccionar**.
2. Ve a la pestaña **Network** (Red) y en el selector de velocidad (donde dice *No throttling*) cambia a **Offline** (o activa el Modo Avión en tu laptop/teléfono).
3. Verás que en la cabecera el badge cambia inmediatamente a:  
   `🟠 Modo Campo (Sin Red)`
4. Llena un nuevo reporte técnico (ejemplo: *Rancho Las Palmas*, *Generador Diésel*, *Fuga en radiador*) y pulsa **"💾 Guardar Reporte"**.
5. Observa cómo el reporte se guarda al instante con el folio `LOCAL-XXXXXX` y el distintivo amarillo `🟡 Pendiente (Offline)`, sumándose al contador de pendientes.
6. Ahora vuelve a la pestaña Network y cambia de nuevo a **No throttling** (restaurar internet).
7. Verás la notificación toast:  
   `📡 Conexión restablecida. Sincronizando reportes...`  
   y el reporte pasará automáticamente a `✅ Sincronizado` con su folio oficial en el servidor (`REP-2026-XXX`).

---

### 4. Cómo Probar la Instalación PWA
* **En Chrome / Edge en computadora:** Verás un banner azul en la parte superior: *"📲 Instalar TechField en tu Dispositivo"*, o el ícono de instalación en la barra de direcciones (Omnibox). Haz clic en **Instalar App** y se abrirá en una ventana limpia sin marcos de navegador.
* **En Android:** Al abrir la URL segura de Ngrok/LocalTunnel en Chrome, aparecerá el banner para añadir a la pantalla de inicio con su ícono adaptativo.
* **En iPhone (Safari):** Al pulsar el botón de instalación, se abrirá un modal guiándote a pulsar *Compartir (⬆️)* -> *"Añadir a pantalla de inicio (+)"*.

---

### 5. Cómo Correr la Auditoría Lighthouse (PWA 100%)
1. Con la aplicación abierta en `http://localhost:3000`, abre DevTools (**`F12`**).
2. Haz clic en la pestaña **Lighthouse**.
3. Marca únicamente la casilla **Progressive Web App** (dispositivo Mobile o Desktop).
4. Haz clic en **Analyze page load** (Analizar carga de página).
5. Obtendrás la insignia verde de **Progressive Web App aprobada al 100%**.

---

## 📂 Estructura Completa del Proyecto

```text
Proyecto/
├── docs/
│   ├── REPORTE_FINAL_PROYECTO_INTEGRADOR_UTM.html   # 📄 Reporte Maestro Final con botón para guardar en PDF
│   ├── REPORTE_FINAL_PROYECTO_INTEGRADOR_UTM.doc    # 📝 Versión Word lista para abrir
│   ├── 01_ARQUITECTURA_Y_MATRIZ_DECISION.md         # Semana 1: Matriz ponderada de 5 arquitecturas
│   ├── 02_COMPATIBILIDAD_Y_CHECKLIST_INSTALACION.md # Semana 1: Chromium vs Safari y checklist
│   ├── 03_ENTORNO_API_Y_TUNEL_HTTPS.md             # Semana 1: Entorno de desarrollo y túneles
│   └── 04_DESARROLLO_CORE_PWA_Y_AUDITORIA.md        # Semana 2: Core PWA, Service Worker, IndexedDB y Lighthouse
├── data/
│   └── reportes.json                                # Base de datos central en JSON
├── public/
│   ├── index.html                                   # App Shell y estructura semántica
│   ├── offline.html                                 # Pantalla de contingencia offline
│   ├── manifest.json                                # Web App Manifest completo
│   ├── sw.js                                        # Service Worker con caché e intercepción
│   ├── css/
│   │   └── styles.css                               # Estilos Mobile-First y Dark Theme
│   ├── js/
│   │   ├── db.js                                    # Capa NoSQL IndexedDB para datos offline
│   │   └── app.js                                   # Lógica de sincronización, GPS e instalación
│   └── icons/                                       # Íconos PNG 192, 512, maskable, SVG y Apple
├── scripts/
│   ├── generate-icons.js                            # Script generador de iconografía
│   └── test-api.js                                  # Pruebas de integración
├── server.js                                        # Servidor HTTP y API REST en Node.js puro
├── package.json                                     # Configuración del paquete y scripts
├── vercel.json                                      # Despliegue automático en Vercel
└── netlify.toml                                     # Despliegue automático en Netlify
```

---

## 📜 Criterios de Evaluación y Cumplimiento

* **Análisis Arquitectónico (20%):** Justificación completa de 5 arquitecturas con matriz Kepner-Tregoe ponderada al 100%.
* **Entorno y Configuración (15%):** Servidor Node.js seguro, API REST con endpoints funcionales y túnel HTTPS probado.
* **Instalabilidad y Compatibilidad (20%):** Web App Manifest validado, íconos multiresolución, banner custom y compatibilidad Android/iOS.
* **Capacidad Offline (30%):** Service Worker con ciclo de vida, estrategias Stale-While-Revalidate/Network-First e IndexedDB para almacenamiento de contingencia.
* **Calidad Tecnológica (15%):** Puntuación perfecta en Lighthouse PWA y archivos de despliegue listos para la nube.
