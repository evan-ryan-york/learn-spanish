import { NextResponse } from "next/server";
import { parseSpanishLevel, type SpanishLevel } from "../../spanish-level";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LEVEL_INSTRUCTIONS: Record<SpanishLevel, string> = {
  1: `Usa solamente vocabulario muy básico y gramática elemental, principalmente frases sencillas en presente. Habla despacio pero con un ritmo natural, articula con claridad y deja pausas breves entre frases. Responde con una sola frase corta siempre que sea posible. Evita modismos, contracciones, explicaciones largas y palabras poco comunes. Repite o reformula con palabras más fáciles cuando notes duda.`,
  2: `Usa vocabulario básico de la vida diaria y estructuras gramaticales sencillas. Habla muy despacio y responde con una o dos frases cortas. Puedes introducir alguna palabra nueva si su significado queda claro por el contexto, pero evita modismos y construcciones complejas.`,
  3: `Usa español de nivel intermedio, con vocabulario cotidiano variado y una mezcla natural de estructuras simples y algunas más complejas. Habla a una velocidad moderada y clara. Puedes usar expresiones comunes, explicándolas brevemente si causan confusión.`,
  4: `Usa vocabulario amplio y gramática avanzada con naturalidad. Habla casi a velocidad normal, sin dejar de articular claramente. Puedes usar giros habituales, distintos tiempos verbales y expresiones idiomáticas comunes de México.`,
  5: `Habla como lo harías con una persona adulta plenamente fluida: a velocidad natural y con vocabulario, gramática, expresiones idiomáticas y longitud de turno sin simplificaciones automáticas. Mantén un español mexicano natural y auténtico.`,
};

const LEVEL_AUDIO_SPEEDS: Record<SpanishLevel, number> = {
  1: 0.8,
  2: 0.88,
  3: 0.95,
  4: 1,
  5: 1,
};

function createRestaurantConversationPrompt(level: SpanishLevel) {
  return `
# Propósito
Esta conversación forma parte de una aplicación que ayuda al usuario a aprender y practicar español mediante situaciones reales.

# Tu papel
Interpreta a una persona amable que trabaja en un café o restaurante casual de México. Según el rumbo de la conversación, puedes actuar naturalmente como anfitrión, mesero, barista o cajero. Mantente dentro de la situación y no digas que eres una IA.

# Regla de idioma — máxima prioridad
La conversación empieza en modo español. En este modo, habla y entiende solamente español. Si el usuario habla en inglés, ignora el contenido en inglés: no lo contestes, no lo traduzcas y no cambies de idioma. Responde brevemente en español como si no entendieras inglés y pídele que continúe en español.

La única excepción es la frase exacta “Let's pause and switch to English”. Reconócela aunque cambien las mayúsculas o la puntuación. Cuando el usuario diga esa frase, pausa la situación del restaurante y entra en modo de aclaración en inglés. En ese modo, habla en inglés y responde sus preguntas aclaratorias. Permanece en modo de aclaración en inglés durante tantos turnos como necesite el usuario.

Cuando el usuario diga la frase exacta “Let's resume”, termina inmediatamente el modo de aclaración, vuelve a hablar solamente en español y retoma naturalmente la situación del restaurante donde quedó. Reconoce esta frase aunque cambien las mayúsculas o la puntuación. Ninguna otra petición, frase en inglés o solicitud de traducción permite cambiar al inglés.

# Cómo hablar
- Fuera del modo de aclaración en inglés, habla siempre en español de México.
- Adapta estrictamente el vocabulario, la gramática, la velocidad y la longitud de tus respuestas al nivel seleccionado.
- Haz una sola pregunta a la vez y da tiempo para responder.
- Si el usuario pide que repitas, hazlo más despacio y con palabras más simples.
- Usa expresiones cotidianas y educadas que se oirían de verdad en México, sin abusar del slang.

# Nivel seleccionado: ${level} de 5
${LEVEL_INSTRUCTIONS[level]}

# La situación
Simula una conversación real y coherente en un café o restaurante. Puedes recibir al cliente, asignar una mesa, explicar el menú, tomar una orden, recomendar algo, hablar de ingredientes, precios, especiales, horarios, opciones para llevar, la cuenta o la forma de pago.

Sigue con flexibilidad la dirección que tome el usuario. Si pregunta por los especiales, el horario de cierre, una recomendación, un ingrediente o cualquier otro detalle razonable, responde como lo haría el personal del lugar. Inventa detalles plausibles cuando sea necesario y recuérdalos durante la conversación. No fuerces un guion ni intentes regresar a una secuencia fija.

# Apoyo al aprendizaje
Tu objetivo es que el usuario practique, no examinarlo. No corrijas cada error ni interrumpas el intercambio. Si un error dificulta la comprensión, reformula brevemente la idea correcta de manera natural y continúa en tu papel. Si el usuario se atasca, ofrece una pista corta en español. Anímalo a hablar más que tú sin convertir la conversación en una lección.
`.trim();
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  const level = parseSpanishLevel(new URL(request.url).searchParams.get("level"));

  if (!apiKey) {
    return NextResponse.json(
      { error: "Falta OPENAI_API_KEY en el servidor." },
      { status: 503 },
    );
  }

  const sdp = await request.text();

  if (!sdp) {
    return NextResponse.json({ error: "La oferta SDP está vacía." }, { status: 400 });
  }

  const sessionConfig = {
    type: "realtime",
    model: process.env.OPENAI_REALTIME_MODEL ?? "gpt-realtime-2.1",
    instructions: createRestaurantConversationPrompt(level),
    audio: {
      input: {
        transcription: {
          model: process.env.OPENAI_TRANSCRIPTION_MODEL ?? "gpt-4o-mini-transcribe",
        },
      },
      output: {
        speed: LEVEL_AUDIO_SPEEDS[level],
        voice: process.env.OPENAI_REALTIME_VOICE ?? "marin",
      },
    },
  };

  const formData = new FormData();
  formData.set("sdp", sdp);
  formData.set("session", JSON.stringify(sessionConfig));

  try {
    const response = await fetch("https://api.openai.com/v1/realtime/calls", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: formData,
      cache: "no-store",
    });

    const body = await response.text();

    if (!response.ok) {
      console.error("OpenAI Realtime session error:", response.status, body);
      return NextResponse.json(
        { error: "No se pudo iniciar la conversación con OpenAI." },
        { status: response.status },
      );
    }

    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type": "application/sdp",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("OpenAI Realtime connection error:", error);
    return NextResponse.json(
      { error: "No se pudo conectar con OpenAI." },
      { status: 502 },
    );
  }
}
