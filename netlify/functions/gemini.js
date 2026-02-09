// ===========================================
// MOTOR INTELIGENTE (VERSIÓN BACKEND SEGURO)
// ===========================================
async function callSmartAI(prompt) {
    try {
        // AHORA LLAMAMOS A NUESTRO PROPIO SERVIDOR (NETLIFY), NO A GOOGLE DIRECTAMENTE
        const response = await fetch('/.netlify/functions/gemini', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                contents: [{ parts: [{ text: prompt }] }] 
            })
        });

        if (!response.ok) {
            throw new Error(`Error del servidor: ${response.statusText}`);
        }

        const data = await response.json();
        
        // Verificamos si Google nos dio error o respuesta
        if (data.error) throw new Error(data.error.message || "Error en la IA");
        if (!data.candidates || !data.candidates.length) throw new Error("La IA no respondió nada.");

        // Devolvemos el texto limpio
        return data.candidates[0].content.parts[0].text;

    } catch (error) {
        console.error("Fallo en Backend:", error);
        throw error; // Lanzamos el error para que salga la alerta en el iPad
    }
}
