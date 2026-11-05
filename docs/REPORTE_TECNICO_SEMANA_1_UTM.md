# **UNIVERSIDAD TECNOLÓGICA METROPOLITANA (UTM)**
## **PROYECTO INTEGRADOR: FUNDAMENTOS Y ESCENARIOS DE USO DE LAS APLICACIONES WEB PROGRESIVAS (PWA)**
### **DOCUMENTO CONSOLIDADO DE ENTREGABLES PARCIALES - SEMANA 1**

---

* **Carrera:** Ingeniería en Desarrollo y Gestión de Software  
* **Cuatrimestre:** 10°  
* **Fecha:** 28 de Octubre de 2026  
* **Sistema:** TechField PWA - Plataforma de Reportes Técnicos en Zonas Rurales  
* **Profesor de Asignatura:** Evaluación Parcial Semana 1  

---

# **ÍNDICE DE ENTREGABLES DE LA SEMANA 1**

1. [Entregable Parcial 1: Fase de Diagnóstico y Selección Arquitectónica](#1-entregable-parcial-1-fase-de-diagnóstico-y-selección-arquitectónica)
   * 1.1. Análisis de Requerimientos de la Problemática Rural
   * 1.2. Análisis Comparativo de las 5 Arquitecturas
   * 1.3. Matriz de Decisión Ponderada (Scoring Matrix)
   * 1.4. Justificación Técnica de la PWA
2. [Entregable Parcial 2: Compatibilidad y Requerimientos de Instalación](#2-entregable-parcial-2-compatibilidad-y-requerimientos-de-instalación)
   * 2.1. Mapeo de Motores: Chromium vs WebKit / Safari
   * 2.2. Limitaciones Específicas en iOS (ITP, cuotas, sync)
   * 2.3. Tabla Comparativa de Compatibilidad por Sistema Operativo
   * 2.4. Checklist Formal de Criterios Mínimos de Instalación
3. [Entregable Parcial 3: Preparación del Entorno, API REST Base y Túnel HTTPS](#3-entregable-parcial-3-preparación-del-entorno-api-rest-base-y-túnel-https)
   * 3.1. Arquitectura del Entorno de Desarrollo (Node.js)
   * 3.2. Documentación de Endpoints de la API REST
   * 3.3. Configuración de Túneles Seguros HTTPS (Ngrok / LocalTunnel)
   * 3.4. Sección de Evidencias (Capturas de Pantalla)

---

# **1. Entregable Parcial 1: Fase de Diagnóstico y Selección Arquitectónica**

### **1.1. Análisis de Requerimientos de la Problemática Rural**
Una empresa prestadora de servicios de mantenimiento electromecánico y agrícola despliega brigadas de técnicos a zonas rurales, pozos de extracción y comunidades de difícil acceso geográfico. En estos puntos de trabajo, los técnicos deben inspeccionar maquinaria pesada, sistemas de bombeo, arrancadores magnéticos y generadores, levantando reportes técnicos con evidencia y diagnósticos.

**Restricciones Críticas:**
* **Zonas Blancas (Cero Conectividad):** Durante el 70% de la jornada laboral en campo, los dispositivos no cuentan con señal celular ni datos móviles. Cualquier solución dependiente de una conexión síncrona al servidor colapsa de inmediato.
* **Heterogeneidad de Dispositivos (BYOD):** La flota de técnicos utiliza smartphones variados de diversas gamas con sistemas operativos mixtos: **Android** (motores Chromium) y **iPhone** (motores WebKit/Safari).
* **Restricción de Recursos:** Equipos de gama baja con almacenamiento flash limitado y procesadores moderados.
* **Costo y Agilidad de Despliegue:** La empresa no cuenta con presupuestos elevados ni tiempos de desarrollo prolongados para crear y certificar dos aplicaciones independientes en Google Play Store y Apple App Store ($99 USD anuales de membresía Apple).

---

### **1.2. Análisis Comparativo de Alternativas Arquitectónicas**

| Arquitectura | Comportamiento en Zona Rural | Ventajas Principales | Desventajas / Inviabilidad en Campo |
| :--- | :---: | :--- | :--- |
| **1. Web Tradicional (SSR / MPA)** | ❌ Falla total | Bajo costo inicial, actualizaciones inmediatas en servidor. | Requiere conexión HTTP síncrona en cada clic. Sin internet arroja pantalla de error ("Sin conexión"). |
| **2. Orientada a Servicios (API + SPA)** | ❌ Inestable | Separación de Front/Back, comunicación ligera por JSON. | Si el técnico recarga la página o se cierra la pestaña sin red, la app no puede recargarse sin Service Worker. |
| **3. App Nativa (Kotlin + Swift)** | ✅ Excelente offline | Rendimiento máximo, acceso total al hardware y sensores. | Duplica el costo de desarrollo (dos equipos especializados), pago de licencias de desarrollador y fricción en tiendas. |
| **4. Multiplataforma (Flutter / RN)** | ✅ Buen offline | Un solo código base para Android e iOS, interfaz fluida. | Instaladores muy pesados (40 a 70 MB) y dependencia de empaquetado y firmas de certificados para distribución. |
| **5. Web Progresiva (PWA)** | ✅ Excelente offline | **Capacidad offline mediante Service Worker e IndexedDB, peso menor a 2 MB, instalación directa sin tiendas.** | Sujeta a políticas de almacenamiento de navegadores (mitigables mediante arquitectura). |

---

### **1.3. Matriz de Decisión Ponderada (Scoring Matrix)**

*Escala de 1 a 5:* 1 = Inaceptable, 2 = Deficiente, 3 = Aceptable, 4 = Bueno, 5 = Excelente.

| Criterio de Evaluación | Peso (%) | Web Tradicional | Web API / SPA | App Nativa | Multiplataforma | PWA (Elegida) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Capacidad y Resiliencia Offline** | **25%** | 1 (0.25) | 2 (0.50) | 5 (1.25) | 5 (1.25) | **5 (1.25)** |
| **Compatibilidad Multiplataforma (iOS/Android)** | **20%** | 5 (1.00) | 5 (1.00) | 2 (0.40) | 4 (0.80) | **5 (1.00)** |
| **Costo y Tiempo de Desarrollo** | **15%** | 4 (0.60) | 4 (0.60) | 1 (0.15) | 3 (0.45) | **5 (0.75)** |
| **Distribución sin Fricción (Sin App Stores)** | **15%** | 5 (0.75) | 5 (0.75) | 1 (0.15) | 1 (0.15) | **5 (0.75)** |
| **Bajo Consumo de Almacenamiento/Hardware** | **15%** | 5 (0.75) | 4 (0.60) | 2 (0.30) | 2 (0.30) | **5 (0.75)** |
| **Mantenibilidad y Actualizaciones Inmediatas** | **10%** | 4 (0.40) | 4 (0.40) | 2 (0.20) | 3 (0.30) | **5 (0.50)** |
| **CALIFICACIÓN TOTAL PONDERADA (Base 5.0)** | **100%** | **3.75** | **3.85** | **2.45** | **3.25** | **5.00 / 5.00** |

---

# **2. Entregable Parcial 2: Compatibilidad y Requerimientos de Instalación**

### **2.1. Mapeo de Motores de Navegación**
* **Chromium (Chrome, Edge, Samsung en Android):** Entorno maduro. Genera paquetes WebAPK automáticos, soporta `beforeinstallprompt` para banners personalizados, cuotas de almacenamiento de Gigabytes y Background Sync API.
* **WebKit (Safari en iOS):**
  * Sin evento `beforeinstallprompt`: la instalación es manual vía botón "Compartir" -> "Añadir a pantalla de inicio".
  * Política ITP de 7 días: purga de datos locales si la app no se agrega a pantalla de inicio y pasa 7 días inactiva.
  * Cuota inicial más reducida (50 MB).
  * Sin Background Sync: requiere sincronizar al recuperar evento `online` con la app abierta.

### **2.2. Tabla de Compatibilidad por Sistema Operativo**

| Característica / API | Android (Chromium) | iOS (Safari WebKit) | Windows / macOS |
| :--- | :---: | :---: | :---: |
| **Service Worker (install, activate, fetch)** | ✅ 100% Nativo | ✅ Nativo (iOS 11.3+) | ✅ 100% Nativo |
| **Web App Manifest (`display: standalone`)** | ✅ 100% Nativo | ⚠️ Requiere metatags Apple | ✅ 100% Nativo |
| **Almacenamiento Offline (IndexedDB)** | ✅ Múltiples GB | ✅ Cuota controlada | ✅ Múltiples GB |
| **Geolocalización GPS** | ✅ Precisión alta | ✅ Previa autorización | ✅ Por IP / Wi-Fi |
| **Cámara (`capture="environment"`)** | ✅ Trasera directa | ✅ Trasera directa | ⚠️ Webcam |
| **Background Sync API** | ✅ Nativo | ❌ Fallback `online` event | ✅ Nativo |

### **2.3. Checklist de Criterios de Instalación**

| # | Criterio de Auditoría | Estado | Método de Verificación |
| :-: | :--- | :---: | :--- |
| **1** | **Protocolo HTTPS / Localhost activo** | ✅ Verificado | Candado SSL / localhost en puerto 3000 sin advertencias. |
| **2** | **Archivo `manifest.json` vinculado** | ✅ Verificado | DevTools -> Application -> Manifest sin errores. |
| **3** | **Campos requeridos del manifiesto** | ✅ Verificado | `name`, `short_name`, `start_url`, `display: standalone`. |
| **4** | **Íconos reglamentarios 192x192 y 512x512** | ✅ Verificado | PNGs presentes con variante maskable en `public/icons/`. |
| **5** | **Service Worker registrado en raíz** | ✅ Verificado | DevTools -> Application -> Service Workers en verde. |
| **6** | **Manejador de evento `fetch` activo** | ✅ Verificado | Intercepción de peticiones estáticas y API. |
| **7** | **Metatags para Safari iOS** | ✅ Verificado | `apple-mobile-web-app-capable` y `apple-touch-icon`. |

---

# **3. Entregable Parcial 3: Preparación del Entorno, API REST Base y Túnel HTTPS**

### **3.1. Arquitectura del Servidor y API REST**
* **Servidor en Node.js Nativo (`server.js`):** Sin librerías externas pesadas. Arranque rápido con `node server.js`.
* **Persistencia (`data/reportes.json`):** Almacenamiento en JSON que simula la base de datos central de la oficina.

### **3.2. Endpoints de la API REST**
* `GET /api/health` -> Estado y tiempo de actividad del servidor.
* `GET /api/reportes` -> Retorna lista completa de reportes en JSON.
* `POST /api/reportes` -> Recibe nuevo reporte, valida campos y asigna folio `REP-2026-XXX`.
* `POST /api/reportes/sync` -> Recepción por lotes de sincronización offline.

### **3.3. Configuración de Túnel Seguro HTTPS**
Para cumplir con el requisito de HTTPS al probar en teléfonos reales:
```bash
# Con LocalTunnel:
npx localtunnel --port 3000

# O con Ngrok:
ngrok http 3000
```

---

# **4. Sección de Evidencias de Ejecución (Capturas de Pantalla)**

> *Pega aquí las 4 capturas de pantalla solicitadas para la entrega de la Semana 1:*

### **Captura 1: Servidor Node.js Activo en Terminal**
*(Pega aquí la captura de tu terminal mostrando `node server.js` corriendo en el puerto 3000).*

---

### **Captura 2: Endpoint GET /api/reportes en el Navegador**
*(Pega aquí la captura de `http://localhost:3000/api/reportes` mostrando el JSON).*

---

### **Captura 3: Interfaz Web TechField con Reporte Creado (POST)**
*(Pega aquí la captura de `http://localhost:3000` con el formulario lleno y el nuevo reporte insertado).*

---

### **Captura 4: Túnel Seguro HTTPS Abierto en Dispositivo Real**
*(Pega aquí la captura de la URL pública segura `https://...` de Ngrok / LocalTunnel abierta en el navegador o teléfono móvil).*

