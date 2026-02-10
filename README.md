# 📘 Manual de Operaciones: LCorals.ie (LanguagePrep)

**Descripción:** Web App educativa para la preparación de los orales del Leaving Certificate.
**Arquitectura:** Híbrida. Frontend estático (HTML/JS) + Backend Serverless (Netlify Functions).
**Seguridad:** Nivel Alto (API Key oculta en servidor).

---

## 🔗 1. Enlaces Vitales (Centro de Mando)

* **🌐 La Web Oficial:** [https://lcorals.ie](https://lcorals.ie)
* **💻 El Código (GitHub):** [https://github.com/LanguagePrepIE/LCoralprep](https://github.com/LanguagePrepIE/LCoralprep)
* **⚡ Backend & Deploy (Netlify):** [Netlify Dashboard](https://app.netlify.com) *(Aquí se miran los logs si la IA falla)*.
* **📊 Estadísticas (GoatCounter):** [https://lcoralprep.goatcounter.com](https://lcoralprep.goatcounter.com)
* **🧠 Google AI Studio:** Para generar nuevas API Keys si fuera necesario.

---

## 🤖 2. El Motor IA & Seguridad (CAMBIO IMPORTANTE)

Ya **NO** usamos la clave API en el código público (`script.js`). Ahora usamos un **Backend Proxy**.

1.  **Cómo funciona:** El usuario escribe en la web -> La web llama a `/.netlify/functions/gemini` -> Netlify habla con Google -> Google responde a Netlify -> Netlify responde a la web.
2.  **Dónde está la Clave:** La `GEMINI_API_KEY` está guardada como **Variable de Entorno** en el panel de control de Netlify. **Nunca** debe escribirse en los archivos `.js` o `.html`.
3.  **Modelo:** Gemini 1.5 Flash (Optimizado para velocidad y bajo coste).

---

## 🛠️ 3. Solución de Errores (Troubleshooting)

**"La IA no responde / Error de conexión"**
* **Causa 1:** El servidor de Netlify puede estar "dormido" (Cold Start). Reintenta en 5 segundos.
* **Causa 2:** Límite de cuota de Google excedido (Raro, pero posible). Revisa Google AI Studio.
* **Diagnóstico:** Entra en Netlify > Functions > Logs para ver el error real.

**"No veo los cambios que acabo de hacer"**
* **Solución:** GitHub y Netlify tardan 1-2 minutos en procesar los cambios ("Build"). Espera un poco y refresca la web (Ctrl+R / Cmd+R).

**"El audio en Irlandés suena robótico o no suena"**
* **Razón:** Los navegadores (especialmente en iPhone/iPad) no suelen tener una voz instalada para "Gaeilge".
* **Solución:** La web intenta detectar si hay voz irlandesa. Si no la hay, usa una voz inglesa por defecto o avisa al usuario.
* **Consejo:** Recomendar a los alumnos usar Android o instalar paquetes de voz si es posible.

---

## 📝 4. Estructura del Proyecto

* `/index.html` → **Homepage** (Menú principal con banderas).
* `/netlify/functions/gemini.js` → **CEREBRO DEL PROYECTO.** (Código del servidor, no tocar salvo error grave).
* `/es/` → Español (Roleplays, Conversación, Study Mode).
* `/fr/` → Francés (Le Document + Conversación).
* `/ga/` → Irlandés (Sraith Pictiúr, Filíocht, Comhrá).
* `/de/` → Alemán (Rollenspiele, Bildergeschichten).
* `/it/` → Italiano (Roleplays, Storie).
* `/pl/` → Polaco (Rozmowa, Portfolio).
* `/eal/` → English as Additional Language (Support).

---

## 📚 5. Nuevas Funcionalidades (2026 Update)

* **Study Mode:** Checkpoints de gramática y vocabulario generados dinámicamente.
* **Footer Legal:** Aviso de privacidad, Copyright y Disclaimer sobre la IA (Protección legal).
* **Formularios Seguros:** Formspree configurado para no pedir datos personales (GDPR Friendly).

---

## 🚀 6. Hoja de Ruta (Roadmap)

* [x] Migrar a Backend Seguro (Netlify Functions).
* [x] Implementar Alemán, Italiano y Polaco.
* [x] Crear "Study Mode" para repaso de gramática.
* [x] Comprar dominio `.ie`.
* [ ] Junior Cycle (Gramática y Vocabulario - Futuro proyecto).
* [ ] Mejorar el TTS (Text-to-Speech) de Irlandés (Investigar APIs externas).

---

**⚠️ NOTA FINAL:** Si editas código desde el iPad, cuidado con las comillas "inteligentes" (`“ ”`). El código siempre necesita comillas rectas (`" "`).
