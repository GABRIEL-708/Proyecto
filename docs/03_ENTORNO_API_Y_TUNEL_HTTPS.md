# **Guía del Entorno de Desarrollo, API REST Base y Túnel Seguro HTTPS**
## **Proyecto Integrador: Fundamentos y Escenarios de Uso de las Aplicaciones Web Progresivas (PWA)**
### **Semana 1 - Entregable Parcial 3**

---

### **Ficha Técnica del Entregable**
* **Institución:** Universidad Tecnológica Metropolitana (UTM)  
* **Asignatura:** Desarrollo Web Progresivo / Proyecto Integrador  
* **Cuatrimestre:** 10°  
* **Proyecto:** TechField PWA  
* **Fecha:** 28 de Octubre de 2026  

---

## **1. Preparación del Entorno de Desarrollo**

Para el desarrollo del proyecto se configuró un entorno basado en estándares modernos, con cero sobrecarga de dependencias y listo para auditoría:

* **Node.js:** Versión instalada en el sistema (v24.x LTS). Proporciona el entorno de ejecución para el servidor web y la API REST.
* **Arquitectura de Servidor:** Servidor HTTP nativo en Node.js (`server.js`) que:
  * Provee endpoints REST para la recepción y persistencia de reportes técnicos.
  * Implementa encabezados CORS universales (`Access-Control-Allow-Origin: *`) para permitir peticiones desde cualquier túnel seguro.
  * Sirve el frontend web con tipado MIME estricto (`.html`, `.css`, `.js`, `.json`, `.png`, `.svg`).
  * Persiste la información en el sistema de archivos local (`data/reportes.json`) emulando una base de datos central de oficina.
* **Herramientas de Inspección y Auditoría:**
  * **Google Chrome / Microsoft Edge DevTools:** Pestaña *Application* (Manifest, Service Workers, Storage, IndexedDB), Pestaña *Network* (Simulador de velocidad y modo offline) y Pestaña *Lighthouse*.

---

## **2. Documentación Técnica de la API REST Base**

La API REST desacoplada simula el servidor de la empresa receptora de los reportes. Cuenta con los siguientes endpoints operativos:

### **2.1. Healthcheck del Servidor**
* **Método:** `GET`
* **Ruta:** `/api/health`
* **Descripción:** Permite verificar que el servicio se encuentra en línea y reportar métricas de tiempo de actividad (*uptime*).
* **Ejemplo de Respuesta (JSON):**
```json
{
  "status": "ok",
  "servicio": "TechField PWA Backend API",
  "version": "1.0.0",
  "uptime": 45.2,
  "timestamp": "2026-10-28T18:30:00.000Z"
}
```

### **2.2. Obtener Lista de Reportes Persistidos**
* **Método:** `GET`
* **Ruta:** `/api/reportes`
* **Descripción:** Devuelve el listado completo de reportes almacenados en la base de datos central.
* **Ejemplo de Respuesta (JSON):**
```json
[
  {
    "id": "REP-2026-001",
    "cliente": "Rancho Santa María",
    "contacto": "+52 951 123 4567",
    "tipoEquipo": "Bomba de Riego Sumergible 5HP",
    "numeroSerie": "BRS-8842-X",
    "prioridad": "Alta",
    "estado": "Sincronizado",
    "falla": "Disparo constante de protección térmica en arrancador magnético.",
    "tecnico": "Ing. Carlos Mendoza",
    "fecha": "2026-10-24T14:30:00.000Z"
  }
]
```

### **2.3. Crear un Nuevo Reporte**
* **Método:** `POST`
* **Ruta:** `/api/reportes`
* **Encabezados:** `Content-Type: application/json`
* **Cuerpo de Solicitud (JSON):**
```json
{
  "cliente": "Pozo Ejidal San Isidro",
  "tipoEquipo": "Motor Eléctrico Siemens 15HP",
  "prioridad": "Alta",
  "falla": "Sobrecalentamiento en rodamientos frontales.",
  "tecnico": "Técnico Luis UTM"
}
```
* **Respuesta Exitosa (`201 Created`):**
```json
{
  "mensaje": "Reporte guardado exitosamente en el servidor central",
  "reporte": {
    "cliente": "Pozo Ejidal San Isidro",
    "tipoEquipo": "Motor Eléctrico Siemens 15HP",
    "prioridad": "Alta",
    "falla": "Sobrecalentamiento en rodamientos frontales.",
    "tecnico": "Técnico Luis UTM",
    "id": "REP-2026-003",
    "estado": "Sincronizado",
    "fecha": "2026-10-28T18:35:10.123Z",
    "sincronizadoEn": "2026-10-28T18:35:10.123Z"
  }
}
```

---

## **3. Configuración de Túneles Seguros (HTTPS) para Pruebas en Dispositivos Reales**

Para cumplir con el requerimiento ineludible de las PWAs de ejecutarse sobre un **contexto seguro con certificado SSL/TLS (HTTPS)** al ser probadas desde un smartphone real (Android o iOS), se configuran túneles seguros que exponen el puerto local `3000` a internet.

### **Opción A: Configuración con Ngrok (Recomendado)**
1. Descarga o ejecuta Ngrok.
2. En una terminal independiente de PowerShell o CMD, ejecuta:
   ```powershell
   ngrok http 3000
   ```
3. Ngrok generará una URL pública segura similar a:
   ```text
   Forwarding   https://a1b2-c3d4.ngrok-free.app -> http://localhost:3000
   ```
4. Abre esa URL `https://...` directamente en el navegador de tu teléfono smartphone (Chrome en Android o Safari en iPhone).

### **Opción B: Configuración con LocalTunnel (Alternativa sin Registro)**
Si no cuentas con cuenta de Ngrok, puedes usar LocalTunnel directamente mediante `npx` (incluido en Node.js):
```powershell
npx localtunnel --port 3000
```
LocalTunnel te devolverá una URL pública como:
```text
your url is: https://smooth-fox-12.loca.lt
```

---

## **4. Pasos para Realizar las Pruebas y Tomar las Capturas de Evidencia (Entregable Parcial)**

Para presentar y documentar este entregable ante el profesor o jurado evaluador, sigue estos pasos:

### **Paso 1: Iniciar el Servidor de la API**
En la carpeta del proyecto, abre una terminal y ejecuta:
```powershell
npm start
```
*(O de manera directa: `node server.js`)*.

Deberás ver en la terminal el mensaje de confirmación:
```text
=======================================================
🚀 Servidor TechField PWA iniciado
📡 URL Local:      http://localhost:3000
⚙️  API REST:       http://localhost:3000/api/reportes
💓 Healthcheck:    http://localhost:3000/api/health
📱 PWA Frontend:   http://localhost:3000/
=======================================================
```
> 📷 **Captura 1:** Toma una captura de pantalla de tu terminal mostrando el servidor Node.js corriendo sin errores.

---

### **Paso 2: Verificar el Endpoint de la API en el Navegador**
Abre tu navegador web en tu computadora e ingresa a:
* `http://localhost:3000/api/reportes`

Observarás la respuesta en formato JSON con los reportes semilla iniciales.
> 📷 **Captura 2:** Toma una captura del navegador mostrando la respuesta JSON devuelta por el endpoint `GET /api/reportes`.

---

### **Paso 3: Abrir la Interfaz de Pruebas de la API**
Ingresa en tu navegador a:
* `http://localhost:3000/`

Verás el panel interactivo de Semana 1 de TechField.
1. Llena el formulario con datos de una prueba (ejemplo: Cliente: "Invernadero El Rocío", Equipo: "Ventilador Industrial").
2. Presiona el botón *"Enviar Reporte a la API REST"*.
3. Observa cómo el reporte aparece instantáneamente en la columna derecha de reportes persistidos en el servidor.
> 📷 **Captura 3:** Toma una captura de la interfaz web mostrando el reporte recién insertado y el mensaje de confirmación verde.

---

### **Paso 4: Exponer el Servidor a HTTPS y Probar en un Smartphone Real**
1. Abre una segunda terminal y corre:
   ```powershell
   npx localtunnel --port 3000
   ```
   *(o `ngrok http 3000`)*.
2. Copia la URL HTTPS que te entregue.
3. Abre esa URL en tu teléfono celular (Android o iPhone).
> 📷 **Captura 4:** Toma una foto o captura de pantalla de tu teléfono móvil mostrando la URL segura `https://...` con el candado SSL activo navegando la interfaz de la API.

---

## **5. Resumen de Cumplimiento de Semana 1**

| Requerimiento del Programa | Evidencia Generada | Estado |
| :--- | :--- | :---: |
| **Diagnóstico y Selección Arquitectónica** | `docs/01_ARQUITECTURA_Y_MATRIZ_DECISION.md` con matriz ponderada | ✅ **Completado al 100%** |
| **Compatibilidad y Requerimientos de Instalación** | `docs/02_COMPATIBILIDAD_Y_CHECKLIST_INSTALACION.md` con tabla y checklist | ✅ **Completado al 100%** |
| **Preparación del Entorno y API Base** | `server.js` funcional + `data/reportes.json` + `public/index.html` | ✅ **Completado al 100%** |
| **Túnel Seguro para Dispositivos Reales** | Guía de configuración con Ngrok / LocalTunnel sobre puerto 3000 | ✅ **Completado al 100%** |

