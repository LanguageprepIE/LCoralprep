📘 Manual de Operaciones: LanguagePrep Ireland
Descripción: Web App educativa para la preparación de orales (Leaving Cert) usando IA.
Tecnología: HTML5 + Javascript (Frontend) + Google Gemini API (Backend IA).
Alojamiento: GitHub Pages.
🔗 1. Enlaces Vitales (Los Centros de Mando)
 * La Web (Pública): https://languageprepie.github.io/LCoralprep/
 * El Código (GitHub): https://github.com/LanguagePrepIE/LCoralprep
 * Estadísticas (Visitas): https://lcoralprep.goatcounter.com
 * Gestión de IA (Prompts y Claves): Google AI Studio
 * Gestión de Pagos/Seguridad: Google Cloud Console
🤖 2. La Clave API (El Motor)
 * Modelo usado: Gemini 1.5 Flash (Rápido y barato/gratis).
 * Seguridad: La clave está restringida por "HTTP Referrer". Solo funciona si la petición viene de languageprepie.github.io/*.
 * Si cambias de dominio: Si compras languageprep.ie, HAY QUE IR a Google Cloud Console y añadir esa nueva dirección a las restricciones de la API Key, o dejará de funcionar.
🛠️ 3. Solución de Errores Frecuentes (Troubleshooting)
"La IA no responde / Error de conexión"
 * Revisar comillas: Si editaste código desde el iPad, asegúrate de que las comillas son rectas " y no curvadas “.
 * Caché: GitHub tarda hasta 5 minutos en actualizar. Prueba en Pestaña de Incógnito.
 * Restricciones: ¿Has cambiado el nombre del repo o la URL? Revisa la Google Cloud Console.
"El audio en Irlandés suena raro"
 * Estado: El audio (speakText) está desactivado intencionalmente en iPad/iPhone para evitar la pronunciación inglesa incorrecta.
 * Excepción: El código tiene un "Detector Inteligente". Si detecta una voz nativa irlandesa (Android o configuración específica), la usará. Si no, se queda mudo.
 * Consejo: Decir a los alumnos que pongan el Teclado en Gaeilge antes de dictar para que les entienda mejor.
"No veo los cambios que acabo de hacer"
 * Es la caché del navegador. Espera 2 minutos y refresca la web varias veces.
📝 4. Estructura del Proyecto
 * /index.html -> La portada con las banderas.
 * /es/index.html -> Web de Español (Roleplays + Conversación).
 * /fr/index.html -> Web de Francés.
 * /ga/index.html -> Web de Irlandés (Sin audio de salida).
 * Para volver al menú: El título "LanguagePrep Ireland" tiene un enlace invisible ../ que lleva a la portada.
📊 5. Estadísticas (GoatCounter)
 * No usa Cookies (GDPR Friendly).
 * Código insertado al final del </body> en todos los archivos.
 * Mide visitas únicas y páginas más vistas.
🚀 6. Hoja de Ruta (Futuro)
 * [ ] Comprar dominio .ie (requiere carné de conducir irlandés).
 * [ ] Crear sección de Italiano (/it/).
 * [ ] Junior Cycle (Gramática y Vocabulario - Proyecto aparte).
 * [ ] Añadir "The Document" en Francés.
Nota Final: Recuerda NUNCA publicar la Clave API escrita en un chat, email o foto. Aunque tiene restricciones de dominio, es mejor mantenerla oculta en el código.
