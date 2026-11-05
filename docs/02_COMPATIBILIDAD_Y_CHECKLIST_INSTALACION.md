# **Compatibilidad Multiplataforma y Checklist de Requerimientos de Instalación**
## **Proyecto Integrador: Fundamentos y Escenarios de Uso de las Aplicaciones Web Progresivas (PWA)**
### **Semana 1 - Entregable Parcial 2**

---

### **Ficha Técnica del Documento**
* **Institución:** Universidad Tecnológica Metropolitana (UTM)  
* **Asignatura:** Desarrollo Web Progresivo / Proyecto Integrador  
* **Cuatrimestre:** 10°  
* **Proyecto:** TechField PWA  
* **Fecha:** 28 de Octubre de 2026  

---

## **1. Investigación y Mapeo de Motores de Navegación**

El ecosistema web móvil se encuentra dividido principalmente en dos grandes motores de renderizado y ejecución:

### **1.1. Motores Basados en Chromium (Blink / V8)**
* **Navegadores representativos:** Google Chrome (Android, Windows, macOS), Microsoft Edge, Brave, Samsung Internet, Opera.
* **Comportamiento PWA:**
  * Son los motores con **soporte de referencia y mayor madurez** para los estándares de las PWA.
  * En Android generan un **WebAPK**: un paquete binario ligero generado automáticamente por el sistema operativo que integra la PWA directamente en el cajón de aplicaciones de Android, permite recibir intents del sistema, asociar tipos de archivo e integrarse al control de batería nativo.
  * Soporte completo para el evento nativo `beforeinstallprompt`, permitiendo a los desarrolladores crear banners de instalación personalizados.
  * Soporte pleno para la API de Sincronización en Segundo Plano (**Background Sync API**) y Notificaciones Push (**Web Push API**).

### **1.2. Motor WebKit (Safari en iOS / iPadOS)**
* **Navegadores representativos:** Safari (iOS / iPadOS). *(Nota técnica: En iOS, todos los navegadores de terceros como Chrome o Firefox están obligados por Apple a usar WebKit internamente).*
* **Comportamiento PWA y Limitaciones Específicas:**
  * **No existe evento `beforeinstallprompt`:** Apple no permite a las aplicaciones web desplegar un botón de instalación en pantalla mediante código. El usuario debe pulsar manualmente el botón de "Compartir" de Safari y seleccionar *"Añadir a pantalla de inicio"*.
  * **Política de Desalojo de Almacenamiento (7-Day ITP Cap):** Safari implementa *Intelligent Tracking Prevention* (ITP). Si una PWA no se añade a la pantalla de inicio y el usuario pasa 7 días sin usarla, Safari puede eliminar las cachés y datos locales de IndexedDB para liberar espacio o proteger la privacidad. Una vez añadida a la pantalla de inicio, este límite se mitiga considerablemente.
  * **Límites de Almacenamiento:** Mientras que Chromium en Android permite hasta el 60% del espacio libre en disco para IndexedDB (decenas de Gigabytes), WebKit en iOS tiene un límite más restrictivo por origen (inicialmente 50 MB, ampliables dinámicamente si el usuario lo autoriza).
  * **Falta de Background Sync:** WebKit no implementa la Background Sync API nativa del W3C. Si la app se cierra antes de sincronizar datos, la sincronización debe esperar a que el usuario vuelva a abrir la aplicación.
  * **Web Push Tardío:** Las notificaciones push en iOS solo están disponibles a partir de **iOS 16.4** y únicamente cuando la PWA ha sido agregada a la pantalla de inicio por el usuario.

---

## **2. Tabla Comparativa de Compatibilidad por Sistema Operativo**

A continuación se detalla la matriz de compatibilidad de APIs clave para el funcionamiento de una PWA de servicio técnico:

| Característica / API Web | Android (Chrome / Edge / Samsung) | iOS (Safari / WebKit) | Windows / macOS (Desktop Chrome / Edge) | Impacto en el Proyecto TechField |
| :--- | :---: | :---: | :---: | :--- |
| **Service Worker (Lifecycle: install, activate, fetch)** | ✅ **Soporte Total (100%)** | ✅ **Soporte Total (Desde iOS 11.3)** | ✅ **Soporte Total (100%)** | **Crítico:** Garantiza la carga de la interfaz sin internet en ambos sistemas. |
| **Web App Manifest (`manifest.json`)** | ✅ **Soporte Nativo Completo** | ⚠️ **Soporte Parcial** (Requiere etiquetas `<meta apple-...>`) | ✅ **Soporte Nativo Completo** | **Alto:** Requiere configurar metatags propietarios de Apple para pantalla completa. |
| **Instalación como App (Standalone)** | ✅ **WebAPK transparente con banner directo** | ⚠️ **Manual** ("Compartir" -> "Añadir a pantalla") | ✅ **Instalable desde barra de direcciones** | **Alto:** Requiere guiar al usuario de iOS con un modal ilustrativo. |
| **IndexedDB (Persistencia de Reportes)** | ✅ **Soporte Completo (GB de capacidad)** | ✅ **Soporte Funcional** (Con límite de cuota) | ✅ **Soporte Completo** | **Crítico:** Base de datos donde se guardan los reportes en campo. |
| **Geolocalización GPS (`navigator.geolocation`)** | ✅ **Soporte Total (GPS de precisión)** | ✅ **Soporte Total (Previa autorización)** | ✅ **Soporte por IP / Wi-Fi** | **Crítico:** Levantamiento de coordenadas de pozos o maquinaria. |
| **Captura de Fotografía (`input capture="environment"`)** | ✅ **Acceso a cámara trasera nativo** | ✅ **Acceso a cámara trasera nativo** | ⚠️ **Webcam frontal/externa** | **Alto:** Permite documentar la evidencia de la falla sin librerías externas. |
| **Background Sync API (`sync` event)** | ✅ **Soporte Total** | ❌ **No Implementado en WebKit** | ✅ **Soporte Total** | **Medio:** En iOS se implementa un fallback escuchando el evento `window.ononline`. |
| **Web Push Notifications** | ✅ **Soporte Total** | ⚠️ **Solo a partir de iOS 16.4+ (En Home Screen)** | ✅ **Soporte Total** | **Bajo:** No es bloqueante para el levantamiento de reportes. |

---

## **3. Identificación de los Requerimientos Mínimos de Instalación**

Para que un navegador considere que un sitio web es una **PWA Instalable** y active los mecanismos de instalación (como el prompt nativo o la evaluación de Lighthouse PWA), deben cumplirse obligatoriamente tres pilares técnicos:

### **Pilar 1: Contexto de Transporte Seguro (HTTPS Obligatorio)**
* El sitio debe ser servido a través de un protocolo cifrado **HTTPS** con certificado SSL/TLS válido.
* **Excepción de Desarrollo:** El navegador permite **`http://localhost`** o **`http://127.0.0.1`** como origen seguro exclusivamente durante la etapa de pruebas locales en el entorno de desarrollo.
* **Pruebas en Móviles Reales:** Al probar en un smartphone conectado por red local o túnel, **es indispensable usar un túnel seguro con certificado HTTPS** (como **Ngrok** o **LocalTunnel**) o la PWA no podrá registrar el Service Worker ni mostrar el botón de instalación.

### **Pilar 2: Web App Manifest Válido (`manifest.json`)**
El archivo de manifiesto es un archivo JSON que describe los metadatos de la aplicación al sistema operativo. Debe contener como mínimo:
1. `name`: Nombre formal completo de la aplicación ("TechField - Reportes Técnicos en Campo").
2. `short_name`: Nombre corto para mostrarse debajo del ícono en la pantalla de inicio ("TechField", máx. 12 caracteres recomendados).
3. `start_url`: Ruta inicial donde debe abrirse la aplicación (ej. `/` o `/?source=pwa`).
4. `display`: Debe ser `standalone` o `fullscreen` (para ocultar la barra de URL y botones del navegador, dando experiencia de aplicación nativa).
5. `icons`: Matriz de íconos que contenga obligatoriamente:
   * Al menos un ícono en resolución **192x192 píxeles** (formato PNG).
   * Al menos un ícono en resolución **512x512 píxeles** (formato PNG).
   * Se recomienda incluir una variante con `purpose: "maskable"` para adaptarse a las formas de íconos adaptativos de Android (círculos, cuadrados con esquinas redondeadas, squircle).
6. `theme_color`: Color hexadecimal que pinta la barra de estado del sistema operativo.
7. `background_color`: Color hexadecimal de fondo mostrado durante la pantalla de inicio (Splash Screen) mientras carga el App Shell.

### **Pilar 3: Service Worker Registrado con Manejador de Evento `fetch`**
* Debe existir un archivo JavaScript (`sw.js`) registrado exitosamente en el navegador mediante `navigator.serviceWorker.register('/sw.js')`.
* El Service Worker debe tener implementado un escucha del evento **`fetch`** (`self.addEventListener('fetch', ...)`). Sin este evento, los motores de los navegadores asumen que la aplicación no tiene capacidad de intercepción de red y deniegan la instalabilidad.

---

## **4. Checklist Formal de Criterios de Instalación**

Utilice esta lista de verificación para auditar la aplicación antes de la presentación y pruebas:

| # | Criterio de Auditoría | Estado | Método de Verificación en DevTools |
| :-: | :--- | :---: | :--- |
| **1** | **Protocolo HTTPS / Localhost activo** | [ ] Verificado | Comprobar candado verde en la barra o consola sin advertencias de *Insecure Origin*. |
| **2** | **Archivo `manifest.json` vinculado en el HTML** | [ ] Verificado | Pestaña *Application* -> *Manifest*. Debe cargar sin errores de sintaxis JSON. |
| **3** | **Campos requeridos en el manifiesto** (`name`, `short_name`, `start_url`, `display: standalone`) | [ ] Verificado | Pestaña *Application* -> *Manifest* -> Validar que los campos no estén vacíos. |
| **4** | **Íconos PNG 192x192 y 512x512 presentes** | [ ] Verificado | Pestaña *Application* -> *Manifest* -> Sección *Icons*. Deben previsualizarse correctamente. |
| **5** | **Metatags para compatibilidad con iOS Safari** | [ ] Verificado | Validar en `<head>`: `<meta name="apple-mobile-web-app-capable" content="yes">` y `<link rel="apple-touch-icon" ...>`. |
| **6** | **Service Worker registrado en la raíz (`scope: /`)** | [ ] Verificado | Pestaña *Application* -> *Service Workers*. Debe mostrar estado en verde *"Activated and is running"*. |
| **7** | **Manejador de evento `fetch` implementado en `sw.js`** | [ ] Verificado | El Service Worker debe responder a peticiones de red incluso en modo desconectado. |
| **8** | **Etiqueta Viewport responsiva** | [ ] Verificado | `<meta name="viewport" content="width=device-width, initial-scale=1.0">` en `<head>`. |
| **9** | **Carga inicial rápida (App Shell)** | [ ] Verificado | Pestaña *Lighthouse* -> Sección *Progressive Web App*. |
| **10**| **Disponibilidad en túnel seguro para pruebas móviles** | [ ] Verificado | Acceso comprobado vía URL `https://*.ngrok-free.app` en dispositivo Android y iPhone. |

---

## **5. Conclusiones para la Semana 1**

El diagnóstico de compatibilidad demuestra que, a pesar de las políticas más cerradas de Apple en WebKit, la PWA es 100% viable para la empresa de servicios técnicos. Siguiendo las directrices de este documento (manejo de metadags de Apple, almacenamiento en IndexedDB y túneles seguros HTTPS con Ngrok), la aplicación garantiza una experiencia uniforme tanto para el técnico con Android de gama media como para el técnico con iPhone en zonas rurales.

