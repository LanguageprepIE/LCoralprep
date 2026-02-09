// BACKEND EN FORMATO MODERNO (ES MODULES)
// Soluciona el error "HandlerNotFound"

export const handler = async (event, context) => {
    // 1. Solo aceptamos pedidos POST (enviar datos)
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        // 2. Recuperamos la clave secreta de la caja fuerte de Netlify
        const apiKey = process.env.GEMINI_API_KEY;
        
        if (!apiKey) {
            return { statusCode: 500, body: JSON.stringify({ error: "Falta la API Key en Netlify. Revisa la configuración." }) };
        }

        // 3. Leemos lo que pide el usuario
        const body = JSON.parse(event.body);
        const contents = body.contents;

        // 4. Llamamos a Google Gemini (Modelo 2.0 Flash)
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents })
        });

        const data = await response.json();

        // 5. Devolvemos la respuesta
        return {
            statusCode: 200,
            body: JSON.stringify(data)
        };

    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};
