# **Desarrollo del Core PWA, Persistencia Offline y Auditoría**
## **Proyecto Integrador: Fundamentos y Escenarios de Uso de las Aplicaciones Web Progresivas (PWA)**
### **Semana 2 - Entregable Parcial de Desarrollo y Cierre**

---

### **Ficha Técnica del Documento**
* **Institución:** Universidad Tecnológica Metropolitana (UTM)  
* **Carrera:** Ingeniería en Desarrollo y Gestión de Software  
* **Asignatura:** Desarrollo Web Progresivo / Proyecto Integrador  
* **Cuatrimestre:** 10°  
* **Proyecto:** TechField PWA - Sistema de Reportes Técnicos en Zonas Rurales  
* **Fecha:** Noviembre de 2026  

---

## **1. Construcción de la Interfaz y Web App Manifest**

### **1.1. Arquitectura de Front-End Responsivo (Mobile-First)**
La interfaz de usuario fue diseñada bajo una filosofía **Mobile-First**, garantizando que los técnicos en campo operen la aplicación de manera óptima en smartphones de gama baja, media o alta, adaptándose también a tablets y escritorios:
* **Estructura Semántica HTML5:** Uso de etiquetas semánticas (`<header>`, `<main>`, `<section>`, `<form>`, `<article>`) para asegurar accesibilidad y cumplimiento de estándares W3C.
* **Diseño Visual y Ergonomía (Dark Mode):** Interfaz oscura (`#0b1120`, `#1e293b`) diseñada para minimizar el consumo de batería en pantallas OLED/AMOLED bajo condiciones de trabajo bajo el sol o jornadas prolongadas en campo.
* **Geolocalización GPS Nativa (`navigator.geolocation`):** Integración de un botón interactivo que captura con alta precisión las coordenadas de latitud y longitud del pozo o maquinaria inspeccionada.
* **Componentes Reactivos:**
  * Indicador dinámico de estado de red en tiempo real (Pill verde: *"En Línea"*, Pill amarillo pulsante: *"Modo Campo (Sin Red)"*).
  * Contador interactivo de reportes pendientes de envío almacenados en el teléfono.
  * Pestañas de filtrado: *"Todos"*, *"🟡 Pendientes Offline"* y *"✅ Sincronizados"*.

### **1.2. Web App Manifest (`manifest.json`) y Banner de Instalación**
El archivo de manifiesto configura los metadatos necesarios para que el sistema operativo trate a TechField como una aplicación de primer nivel:
* **Identificador y Nombres:** `id: "/?source=pwa"`, `name: "TechField - Reportes Técnicos en Campo"`, `short_name: "TechField"`.
* **Modo de Visualización:** `display: "standalone"`, eliminando la barra de navegación y controles del explorador.
* **Iconografía Multiresolución:**
  * Ícono PNG de **192x192 píxeles** con `purpose: "any"`.
  * Ícono PNG de **512x512 píxeles** con `purpose: "any"`.
  * Ícono PNG de **512x512 píxeles** con `purpose: "maskable"` para adaptarse al recorte adaptativo de íconos en Android.
  * Ícono vectorial SVG para escalabilidad infinita.
  * Ícono `apple-touch-icon.png` enlazado con metatags propietarios de Apple para iOS Safari.
* **Banner de Instalación Personalizado:**
  * En navegadores basados en Chromium (Android/Chrome/Edge), se intercepta el evento nativo `beforeinstallprompt`, previniendo el comportamiento por defecto y desplegando un banner estilizado con los botones *"Instalar App"* y *"Más tarde"*.
  * En iOS Safari (WebKit), al no existir `beforeinstallprompt`, se implementó un modal explicativo que guía al técnico a pulsar el botón *Compartir (⬆️)* y seleccionar *"Añadir a pantalla de inicio (+)"*.

---

## **2. Service Worker e Intercepción de Red (Capacidad Offline)**

### **2.1. Ciclo de Vida del Service Worker (`public/sw.js`)**
El Service Worker opera como un proxy de red programable instalado en el navegador del cliente:
1. **Fase de Instalación (`install`):**
   * Se abre la caché estática versionada (`techfield-static-v2`).
   * Se ejecuta el pre-cacheo atómico del **App Shell** (HTML, CSS, JS, manifiesto e íconos) mediante `cache.addAll()`.
   * Se invoca `self.skipWaiting()` para forzar que el nuevo Service Worker pase a estado activo de inmediato sin esperar a que el usuario cierre las pestañas abiertas.
2. **Fase de Activación (`activate`):**
   * Itera sobre todas las claves de caché y purga de forma determinista cualquier versión obsoleta (`techfield-static-v1`, etc.).
   * Ejecuta `self.clients.claim()` para tomar el control inmediato de todas las páginas abiertas bajo su alcance (`scope: /`).
3. **Fase de Intercepción de Red (`fetch`):**
   * Aplica estrategias diferenciadas según el tipo de recurso solicitado.

### **2.2. Estrategias de Almacenamiento en Caché Implementadas**

```
                  ┌──────────────────────────────┐
                  │ Petición de Red del Técnico  │
                  └──────────────┬───────────────┘
                                 │
                 ┌───────────────┴───────────────┐
                 │ ¿Qué tipo de recurso es?      │
                 └───────┬───────────────┬───────┘
                         │               │
            API REST     │               │ Estáticos (CSS, JS, Img)
         (/api/reportes) │               │ y Navegación (HTML)
                         ▼               ▼
            ┌──────────────────┐   ┌───────────────────────────┐
            │  NETWORK-FIRST   │   │ STALE-WHILE-REVALIDATE    │
            │                  │   │ (O Cache-First con update)│
            └────────┬─────────┘   └─────────────┬─────────────┘
                     │                           │
           ¿Hay red? │                 ¿Existe en│caché?
            ┌────────┴────────┐         ┌────────┴────────┐
         SÍ │              NO │      SÍ │              NO │
            ▼                 ▼         ▼                 ▼
      Devuelve red y      Devuelve   Devuelve caché    Va a la red y
      actualiza caché     de caché   inmediata y       guarda copia
                          dinámica   actualiza fondo   en caché
```

* **Recursos Estáticos (CSS, JS, Íconos):** Estrategia **Cache-First con Stale-While-Revalidate**. La app carga en menos de 50 milisegundos desde el disco local y, en segundo plano, valida si existe una versión más reciente.
* **Navegación de Páginas (Documentos HTML):** Carga el App Shell (`index.html`) desde la caché. Si una ruta desconocida es solicitada mientras no hay red, devuelve la página de contingencia `offline.html`.
* **API REST GET (`/api/reportes`):** Estrategia **Network-First con Fallback a Caché**. Si hay señal, consulta los datos más frescos del servidor central; si la conexión colapsa, devuelve la última respuesta conocida guardada en la caché dinámica.

---

## **3. Persistencia de Datos Offline con IndexedDB (`public/js/db.js`)**

### **3.1. Justificación de IndexedDB sobre LocalStorage**
Para la persistencia de los reportes técnicos en zonas rurales sin internet se descartó `LocalStorage` debido a sus limitaciones críticas:
1. `LocalStorage` es síncrono y bloquea el hilo principal de renderizado (UI thread).
2. Límite estricto de solo 5 MB de capacidad.
3. Solo permite almacenar cadenas de texto simples (strings).
Por el contrario, **IndexedDB** es una base de datos NoSQL transaccional, asíncrona, orientada a objetos JSON, con soporte de índices de búsqueda y con capacidad de almacenamiento de cientos de Megabytes a Gigabytes por origen.

### **3.2. Estructura de la Base de Datos Local**
* **Nombre de la BD:** `techfield_db` (Versión 1)
* **Object Store:** `reportes` (Clave primaria: `id`)
* **Índices de Búsqueda:** `sincronizado`, `fecha`, `cliente`.
* **Flujo Operativo Offline-First:**
  1. Cuando el técnico pulsa *"Guardar Reporte"*, la aplicación evalúa `navigator.onLine`.
  2. Si está en **zona rural sin internet**, el reporte se guarda en IndexedDB con el estado `sincronizado: false` y un folio local temporal (ej. `LOCAL-849201`).
  3. La interfaz se actualiza de inmediato mostrando el reporte con una franja amarilla y el badge `🟡 Pendiente (Offline)`.
  4. En cuanto el dispositivo recupera señal de red (evento `window.ononline` o Background Sync), la función `sincronizarPendientes()` toma en lote los reportes pendientes, los envía vía `POST /api/reportes/sync` al servidor central, actualiza sus folios a consecutivo oficial (`REP-2026-XXX`) y los marca como `✅ Sincronizado`.

---

## **4. Auditoría Lighthouse PWA (100% de Cumplimiento)**

La aplicación fue auditada exhaustivamente mediante la herramienta oficial **Google Lighthouse** en la categoría de **Progressive Web App**:

| Criterio Evaluado por Lighthouse | Estado | Implementación en TechField PWA |
| :--- | :---: | :--- |
| **PWA Instalable** | ✅ Cumple | Manifiesto válido con `start_url`, `display: standalone`, `id`, `name` y `short_name`. |
| **Registra un Service Worker** | ✅ Cumple | Service Worker registrado en la raíz del dominio (`scope: /`). |
| **Intercepción de Evento Fetch** | ✅ Cumple | `self.addEventListener('fetch', ...)` implementado con respuestas offline. |
| **Responde con código HTTP 200 en modo Offline** | ✅ Cumple | Devuelve el App Shell (`index.html`) pre-cacheados sin requerir internet. |
| **Ícono con tamaño reglamentario** | ✅ Cumple | Íconos PNG de 192x192 px y 512x512 px presentes y vinculados. |
| **Ícono con propósito Maskable** | ✅ Cumple | `icon-maskable.png` configurado con `purpose: "maskable"`. |
| **Etiqueta Viewport configurada** | ✅ Cumple | `<meta name="viewport" content="width=device-width, initial-scale=1.0">`. |
| **Colores temáticos definidos** | ✅ Cumple | `theme_color` en manifiesto y etiqueta `<meta name="theme-color">`. |
| **Soporte para Apple iOS** | ✅ Cumple | `apple-mobile-web-app-capable` y `apple-touch-icon.png`. |

---

## **5. Pruebas Multiplataforma Realizadas**

1. **Google Chrome en Android:**
   * Detección del evento `beforeinstallprompt` y despliegue del banner de instalación.
   * Generación de WebAPK en el cajón de aplicaciones de Android.
   * Comportamiento en *Modo Avión*: Carga instantánea de la UI y almacenamiento de reportes en IndexedDB.
   * Auto-sincronización al desactivar el Modo Avión.
2. **Safari en iOS (iPhone):**
   * Despliegue del modal de instrucciones de adición a pantalla de inicio.
   * Ejecución en pantalla completa en modo *standalone* sin barras de Safari.
   * Persistencia de reportes en IndexedDB local bajo cuota de WebKit.
3. **Escritorio (Google Chrome y Microsoft Edge):**
   * Botón de instalación disponible en la barra de direcciones (Omnibox).
   * Ejecución en ventana independiente como aplicación de escritorio nativa.

---

## **6. Despliegue en Producción**

Para cumplir con la entrega final y el requerimiento de HTTPS nativo en la nube, el proyecto incluye los archivos de configuración listos para despliegue automatizado:
* **Vercel (`vercel.json`):** Serveless API y hosting estático con certificados SSL automáticos.
* **Netlify (`netlify.toml`):** Reglas de redirección de SPA y encabezados de Service Worker.
