# **Documento de Arquitectura de Software y Matriz de Decisión**
## **Proyecto Integrador: Fundamentos y Escenarios de Uso de las Aplicaciones Web Progresivas (PWA)**
### **Semana 1 - Entregable Parcial 1**

---

### **Ficha Técnica del Proyecto**
* **Institución:** Universidad Tecnológica Metropolitana (UTM)  
* **Asignatura:** Desarrollo Web Progresivo / Proyecto Integrador  
* **Cuatrimestre:** 10°  
* **Sistema:** TechField - Sistema de Reportes Técnicos en Zonas Rurales  
* **Fecha:** 28 de Octubre de 2026  

---

## **1. Diagnóstico y Análisis de Requerimientos de la Problemática**

### **1.1. Contexto Operativo**
Una empresa prestadora de servicios de mantenimiento electromecánico y agrícola despliega brigadas de técnicos a zonas rurales, pozos de extracción y comunidades de difícil acceso geográfico. En estos puntos de trabajo, los técnicos deben:
1. Inspeccionar maquinaria pesada, sistemas de bombeo, arrancadores magnéticos y generadores.
2. Levantar reportes de fallas, diagnósticos técnicos, mediciones eléctricas y coordenadas GPS del sitio.
3. Adjuntar evidencia fotográfica y registrar la firma o recepción del cliente.
4. Generar folios de atención sin duplicidad.

### **1.2. Problemática y Restricciones Críticas**
* **Conectividad Nula o Intermitente (Zonas Blancas / Zonas Rurales):** Durante el 70% de la jornada laboral en campo, los dispositivos no cuentan con señal celular ni datos móviles (GPRS, 3G, 4G, 5G ni Wi-Fi). Cualquier solución dependiente de una conexión síncrona al servidor colapsa de inmediato.
* **Heterogeneidad de Dispositivos (BYOD - Bring Your Own Device):** La cuadrilla de técnicos utiliza una flota heterogénea de teléfonos inteligentes de diversas gamas (baja, media y alta) con sistemas operativos distintos: **Android** (con navegadores basados en Chromium) y **iOS / iPhone** (con Safari/WebKit).
* **Restricción de Recursos:** Equipos de gama baja con almacenamiento flash limitado y procesadores de potencia moderada.
* **Costo y Agilidad de Despliegue:** La empresa no cuenta con presupuestos elevados ni tiempos de desarrollo prolongados para crear y certificar dos aplicaciones independientes en las tiendas oficiales (Google Play Store y Apple App Store).

---

## **2. Análisis Comparativo de Alternativas Arquitectónicas**

A continuación se analizan las cinco opciones de arquitectura de software frente a la problemática planteada:

### **2.1. Aplicación Web Tradicional (Multi-Page Application / SSR Clásica)**
* **Descripción:** Arquitectura basada en cliente-servidor tradicional donde cada interacción del usuario requiere una petición HTTP que el servidor procesa devolviendo una página HTML completa.
* **Ventajas:**
  * Muy bajo costo de desarrollo inicial.
  * Compatibilidad universal con cualquier navegador web.
  * Centralización del código y actualizaciones inmediatas en el servidor.
* **Desventajas Críticas en el Escenario:**
  * **Inviabilidad Absoluta Offline:** Al perder la conexión a internet en la zona rural, el navegador arroja de inmediato la pantalla de error ("Sin conexión / Dinosaurio"). No permite renderizar pantallas ni guardar formularios localmente.
  * Alto consumo de ancho de banda al transferir plantillas completas en cada petición.

### **2.2. Aplicación Orientada a Servicios (Web API + SPA Tradicional sin Service Worker)**
* **Descripción:** Arquitectura desacoplada donde una API REST (JSON) alimenta una aplicación de una sola página (Single Page Application - SPA en React, Angular, Vue o Vanilla JS).
* **Ventajas:**
  * Separación clara de responsabilidades (Front-end independiente del Back-end).
  * Consumo eficiente de datos (solo transfiere objetos JSON ligeros).
  * Posibilidad de ser consumida por múltiples clientes en el futuro.
* **Desventajas Críticas en el Escenario:**
  * Si bien la SPA carga en memoria una vez descargada, si el técnico refresca la página, cierra la pestaña o navega a otra vista sin red, **la aplicación deja de responder por completo**.
  * No cuenta con capacidades nativas de persistencia en caché de assets ni instalación en la pantalla de inicio del dispositivo móvil.

### **2.3. Aplicación Móvil Nativa (Kotlin/Java para Android + Swift para iOS)**
* **Descripción:** Desarrollo de dos aplicaciones completamente independientes utilizando los kits de desarrollo de software (SDK) oficiales de Google y Apple.
* **Ventajas:**
  * Acceso total y de máximo rendimiento a todas las APIs de hardware (sensores, cámara, GPS, almacenamiento SQLite nativo de alta velocidad).
  * Comportamiento offline óptimo mediante bases de datos locales (Room en Android / CoreData o SwiftData en iOS).
* **Desventajas Críticas en el Escenario:**
  * **Costo y Tiempo de Desarrollo Duplicado:** Requiere contratar o formar dos equipos de desarrollo especializados (uno en Android y otro en iOS), manteniendo dos bases de código distintas.
  * **Fricción de Distribución:** Obligación de pagar licencias de desarrollador anuales ($99 USD/año en Apple Developer Program, $25 USD en Google Play) y someterse a revisiones burocráticas de las tiendas de aplicaciones para cada actualización o corrección urgente de errores en campo.

### **2.4. Aplicación Móvil Multiplataforma (Flutter / React Native / .NET MAUI)**
* **Descripción:** Unificación del código base en un único lenguaje (Dart, JavaScript/TypeScript o C#) que se compila a binarios ejecutables para iOS y Android.
* **Ventajas:**
  * Un solo código base para ambas plataformas móviles.
  * Excelente capacidad offline integrando SQLite o Realm.
  * Buen rendimiento y aspecto visual cercano al nativo.
* **Desventajas Críticas en el Escenario:**
  * **Peso del Binario:** El empaquetado del motor (runtime de Flutter o puentes de React Native) genera instaladores pesados (30 MB a 70 MB), un problema severo para técnicos con smartphones de baja capacidad.
  * **Dependencia de Tiendas o Sideloading Complejo:** Continúa requiriendo empaquetado `.apk`/`.aab` e instalación compleja en iOS (donde no es posible instalar binarios fuera de TestFlight o App Store sin certificados empresariales costosos).
  * Mayor complejidad en la cadena de compilación (build tools, Gradle, CocoaPods, Xcode en macOS obligatorio).

### **2.5. Aplicación Web Progresiva (Progressive Web App - PWA)**
* **Descripción:** Aplicación web construida con estándares abiertos (HTML5, CSS3, JavaScript moderno) potenciada por un **Web App Manifest** y un **Service Worker**. Combina la ubicuidad y ligereza de la web con capacidades similares a una aplicación nativa.
* **Ventajas en el Escenario de Campo:**
  * **Capacidad Offline Determinística:** Gracias al Service Worker y a la API de Caché (CacheStorage) junto con **IndexedDB**, la aplicación funciona 100% desconectada de la red.
  * **Instalación Directa sin Tiendas:** El técnico instala la app en segundos desde el navegador mediante el banner de instalación o "Añadir a pantalla de inicio" sin pasar por App Store ni Google Play.
  * **Un Solo Código Base Universal:** Funciona exactamente igual en Android, iOS, tablets y computadoras portátiles.
  * **Peso Mínimo:** La PWA ocupa menos de 2 MB de almacenamiento local, ideal para dispositivos de gama de entrada.
  * **Actualizaciones Instantáneas:** Cualquier mejora en la lógica o diseño se actualiza automáticamente en segundo plano cuando el dispositivo detecta red.

---

## **3. Matriz de Decisión Ponderada**

Para formalizar la selección de la arquitectura, se diseñó una matriz de decisión basada en el método de ponderación de criterios (Kepner-Tregoe / Scoring Matrix). Cada criterio cuenta con un peso porcentual acorde a las prioridades del negocio.

### **Escala de Calificación:**
* **1 - Inaceptable / Crítico** (No cumple con el requerimiento básico).
* **2 - Deficiente** (Cumple parcialmente con fricción considerable).
* **3 - Aceptable** (Cumple con limitaciones tolerables).
* **4 - Bueno** (Cumple eficientemente).
* **5 - Excelente** (Solución ideal para el criterio).

### **Tabla de Evaluación:**

| Criterio de Selección | Peso (%) | Web Tradicional | Web API / SPA | App Nativa (Android + iOS) | Multiplataforma (Flutter/RN) | PWA (Web Progresiva) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Capacidad y Resiliencia Offline** | **25%** | 1 (0.25) | 2 (0.50) | 5 (1.25) | 5 (1.25) | **5 (1.25)** |
| **Compatibilidad Multiplataforma (iOS/Android)** | **20%** | 5 (1.00) | 5 (1.00) | 2 (0.40) | 4 (0.80) | **5 (1.00)** |
| **Costo y Tiempo de Desarrollo** | **15%** | 4 (0.60) | 4 (0.60) | 1 (0.15) | 3 (0.45) | **5 (0.75)** |
| **Distribución sin Fricción (Sin App Stores)** | **15%** | 5 (0.75) | 5 (0.75) | 1 (0.15) | 1 (0.15) | **5 (0.75)** |
| **Bajo Consumo de Almacenamiento/Hardware** | **15%** | 5 (0.75) | 4 (0.60) | 2 (0.30) | 2 (0.30) | **5 (0.75)** |
| **Mantenibilidad y Actualizaciones Inmediatas** | **10%** | 4 (0.40) | 4 (0.40) | 2 (0.20) | 3 (0.30) | **5 (0.50)** |
| **PUNTUACIÓN TOTAL PONDERADA (Base 5.0)** | **100%** | **3.75** | **3.85** | **2.45** | **3.25** | **5.00** |

---

## **4. Justificación Técnica de la Elección: PWA como Escenario de Uso Ideal**

A partir del análisis técnico y la matriz de decisión, se concluye con contundencia que la **Aplicación Web Progresiva (PWA)** es la arquitectura óptima por las siguientes razones de peso:

1. **Cumplimiento Incondicional del Requisito Offline:**
   A través del Service Worker y la estrategia de almacenamiento en caché (*App Shell Architecture* y *Stale-While-Revalidate*), la aplicación carga de inmediato en modo avión. Los datos levantados en campo (reportes, fotos comprimidas y firmas) se almacenan de forma estructurada en **IndexedDB** local, garantizando cero pérdida de información ante apagados imprevistos del teléfono.
2. **Mitigación del Problema BYOD y Heterogeneidad de Plataformas:**
   Al ser una solución basada en estándares W3C (HTML5, ECMAScript, Service Workers), una única base de código se ejecuta con fidelidad en los dispositivos Android (usando motores Chromium/Blink) e iOS (usando WebKit/Safari).
3. **Eliminación de la Dependencia de Tiendas Centralizadas:**
   Los técnicos de campo no requieren cuentas en Google Play ni Apple IDs corporativos configurados para instalar el sistema. Basta con ingresar a la URL segura provista por la empresa y pulsar "Instalar aplicación", logrando un tiempo de enrolamiento de personal inferior a 30 segundos.
4. **Viabilidad Económica:**
   El costo de desarrollo y mantenimiento se reduce en más de un 60% en comparación con el desarrollo nativo dual, maximizando el retorno de inversión (ROI) para la empresa de servicios técnicos.

---

## **5. Conclusiones y Próximos Pasos**

La arquitectura seleccionada para el proyecto integrador combina:
* **Frontend:** PWA con arquitectura Mobile-First, Web App Manifest validado, Service Worker con estrategias de caché personalizadas y capa de datos offline mediante IndexedDB.
* **Backend:** API REST en Node.js ligera y desacoplada para la recepción y sincronización transaccional de los lotes de reportes cuando el técnico recupera la cobertura de red.

