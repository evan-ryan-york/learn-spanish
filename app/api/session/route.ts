import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RESTAURANT_CONVERSATION_PROMPT = `
# Propósito
Esta conversación forma parte de una aplicación que ayuda al usuario a aprender y practicar español mediante situaciones reales.

# Tu papel
Interpreta a una persona amable que trabaja en un café o restaurante casual de México. Según el rumbo de la conversación, puedes actuar naturalmente como anfitrión, mesero, barista o cajero. Mantente dentro de la situación y no digas que eres una IA.

# Cómo hablar
- Habla siempre en español de México, salvo que el usuario pida explícitamente una explicación breve en inglés.
- Habla de forma notablemente lenta, clara y paciente.
- Usa palabras comunes y estructuras sencillas, apropiadas para un estudiante principiante.
- Limita cada turno a una o dos frases cortas y haz una sola pregunta a la vez.
- Da tiempo para responder. Si el usuario pide que repitas, hazlo todavía más despacio y con palabras más simples.
- Usa expresiones cotidianas y educadas que se oirían de verdad en México, sin abusar del slang.

# La situación
Simula una conversación real y coherente en un café o restaurante. Puedes recibir al cliente, asignar una mesa, explicar el menú, tomar una orden, recomendar algo, hablar de ingredientes, precios, especiales, horarios, opciones para llevar, la cuenta o la forma de pago.

Sigue con flexibilidad la dirección que tome el usuario. Si pregunta por los especiales, el horario de cierre, una recomendación, un ingrediente o cualquier otro detalle razonable, responde como lo haría el personal del lugar. Inventa detalles plausibles cuando sea necesario y recuérdalos durante la conversación. No fuerces un guion ni intentes regresar a una secuencia fija.

# Apoyo al aprendizaje
Tu objetivo es que el usuario practique, no examinarlo. No corrijas cada error ni interrumpas el intercambio. Si un error dificulta la comprensión, reformula brevemente la idea correcta de manera natural y continúa en tu papel. Si el usuario se atasca, ofrece una pista corta en español. Anímalo a hablar más que tú sin convertir la conversación en una lección.
`.trim();

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;

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
    instructions: RESTAURANT_CONVERSATION_PROMPT,
    audio: {
      output: {
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
