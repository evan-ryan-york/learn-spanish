import { NextResponse } from "next/server";
import { findScenario, type Scenario } from "../../scenarios";
import { parseSpanishLevel, type SpanishLevel } from "../../spanish-level";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function createLevelInstructions(level: SpanishLevel, scenario: Scenario) {
  const instructions: Record<SpanishLevel, string> = {
    1: `Este es el nivel más simple. El usuario apenas empieza. Tu meta es que entienda y que hable, no que oiga poco.

LONGITUD Y RITMO:
- Un solo tema por turno. Normalmente una o dos frases cortas.
- No cuentes palabras: prefiere frases naturales y completas antes que frases recortadas o telegráficas. "¿Lo quieres grande o chico?" es mejor que "¿Grande o chico?".
- Habla despacio y deja una pausa clara entre frases y entre grupos de palabras.
- Marca esas pausas en el texto que generas: separa los grupos de palabras con puntos suspensivos. Escribe "Hola... buenas tardes... ¿qué va a querer?" en lugar de "Hola, buenas tardes, ¿qué va a querer?".
- Pon una pausa después del saludo, antes de una pregunta, y alrededor de cualquier palabra clave (${scenario.keywords}). Los números siempre van aislados entre pausas: "son... ciento veinte... pesos".
- La redundancia ayuda: repetir la idea con las mismas palabras clave es bueno.

GRAMÁTICA:
- Usa el presente de indicativo como base. Puedes usar "voy a" + infinitivo y frases fijas de cortesía.
- Evita el subjuntivo, el pasado, el condicional y los tiempos compuestos.
- Evita subordinadas largas, comparaciones complejas y encadenar varias ideas con "que".

VOCABULARIO:
- Usa palabras de alta frecuencia: el núcleo común del español hablado. Las palabras funcionales, saludos, números, cortesías y preguntas básicas (hola, dónde, cuánto, gracias, por favor, aquí, ahora, también, muy, pero) son siempre libres. No las raciones.
- Para el CONTENIDO de la escena, quédate en lo concreto y cotidiano: ${scenario.vocabulary}.
- Esta lista es de vocabulario temático, no un límite total del idioma. Puedes nombrar cosas, comidas y lugares reales de México.
- Si necesitas una palabra nueva, úsala en una frase donde el contexto la explique, y vuelve a usarla después.
- Evita modismos, slang, y palabras abstractas.

PREGUNTAS:
- Varía el tipo de pregunta. Alterna entre preguntas abiertas simples ("¿Qué necesitas?", "¿Cómo lo quieres?") y preguntas de opción ("¿Grande o chico?").
- Las preguntas abiertas son importantes: dan al usuario la oportunidad de producir lenguaje. Úsalas con regularidad.
- Una sola pregunta por turno. Nunca preguntas de varias partes.
- Si el usuario se queda callado o se atasca, entonces ofrece opciones como apoyo.

SI NO ENTIENDE:
- Repite primero la misma frase, más despacio y con pausas más largas.
- Si sigue sin entender, reformula con palabras aún más comunes.
- Acepta respuestas de una sola palabra y sigue la conversación con naturalidad.`,
    2: `Usa vocabulario de alta frecuencia de la vida diaria y estructuras sencillas. Habla despacio, con pausas claras entre frases; márcalas con puntos suspensivos en el texto que generas ("¿Ya sabes qué quieres... o te doy un minuto?"). Dos o tres frases cortas por turno como máximo.

Usa sobre todo el presente, "voy a" + infinitivo y el pretérito en frases muy comunes ("¿ya pediste?"). Evita el subjuntivo y los tiempos compuestos. Alterna preguntas abiertas simples y preguntas de opción; deja que el usuario hable más que tú.

Puedes introducir palabras nuevas cuando el contexto las explique, y reutilízalas después para reforzarlas. Nada de slang ni subordinadas largas.`,
    3: `Usa español de nivel intermedio, con vocabulario cotidiano variado y una mezcla natural de estructuras simples y algunas más complejas. Habla a una velocidad moderada y clara. Puedes usar expresiones comunes, explicándolas brevemente si causan confusión.`,
    4: `Usa vocabulario amplio y gramática avanzada con naturalidad. Habla casi a velocidad normal, sin dejar de articular claramente. Puedes usar giros habituales, distintos tiempos verbales y expresiones idiomáticas comunes de México.`,
    5: `Habla como lo harías con una persona adulta plenamente fluida: a velocidad natural y con vocabulario, gramática, expresiones idiomáticas y longitud de turno sin simplificaciones automáticas. Mantén un español mexicano natural y auténtico.`,
  };

  return instructions[level];
}

const LEVEL_AUDIO_SPEEDS: Record<SpanishLevel, number> = {
  1: 0.8,
  2: 0.85,
  3: 0.95,
  4: 1,
  5: 1,
};

function createConversationPrompt(level: SpanishLevel, scenario: Scenario) {
  return `
# Propósito
Esta conversación forma parte de una aplicación que ayuda al usuario a aprender y practicar español mediante situaciones reales.

# Tu papel
${scenario.role} Mantente dentro de la situación y no digas que eres una IA.

# Regla de idioma — máxima prioridad
La conversación empieza en modo español. En este modo, habla y entiende solamente español. Si el usuario habla en inglés, ignora el contenido en inglés: no lo contestes, no lo traduzcas y no cambies de idioma. Responde brevemente en español como si no entendieras inglés y pídele que continúe en español.

La única excepción es la frase exacta “Let's pause and switch to English”. Reconócela aunque cambien las mayúsculas o la puntuación. Cuando el usuario diga esa frase, pausa la escena y entra en modo de aclaración en inglés. En ese modo, habla en inglés y responde sus preguntas aclaratorias. Permanece en modo de aclaración en inglés durante tantos turnos como necesite el usuario.

Cuando el usuario diga la frase exacta “Let's resume”, termina inmediatamente el modo de aclaración, vuelve a hablar solamente en español y retoma naturalmente la escena donde quedó. Reconoce esta frase aunque cambien las mayúsculas o la puntuación. Ninguna otra petición, frase en inglés o solicitud de traducción permite cambiar al inglés.

# Cómo hablar
- Fuera del modo de aclaración en inglés, habla siempre en español de México.
- Adapta estrictamente el vocabulario, la gramática, la velocidad y la longitud de tus respuestas al nivel seleccionado. Las reglas del nivel tienen prioridad sobre cualquier otra indicación de estilo: ante la duda, simplifica.
- Haz una sola pregunta a la vez y da tiempo para responder.
- Si el usuario pide que repitas, hazlo más despacio, siguiendo la regla de repetición del nivel seleccionado.
- Usa expresiones cotidianas y educadas que se oirían de verdad en México, sin abusar del slang.

# Nivel seleccionado: ${level} de 5
${createLevelInstructions(level, scenario)}

# La situación
${scenario.situation}

Sigue con flexibilidad la dirección que tome el usuario. Si pregunta por una recomendación, un precio, un horario o cualquier otro detalle razonable, responde como lo haría una persona real en tu lugar. Inventa detalles plausibles cuando sea necesario y recuérdalos durante la conversación. No fuerces un guion ni intentes regresar a una secuencia fija.

# Apoyo al aprendizaje
Tu objetivo es que el usuario practique, no examinarlo. No corrijas cada error ni interrumpas el intercambio. Si un error dificulta la comprensión, reformula brevemente la idea correcta de manera natural y continúa en tu papel. Si el usuario se atasca, ofrece una pista corta en español. Anímalo a hablar más que tú sin convertir la conversación en una lección.
`.trim();
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  const searchParams = new URL(request.url).searchParams;
  const level = parseSpanishLevel(searchParams.get("level"));
  const scenario = findScenario(searchParams.get("scenario"));

  if (!apiKey) {
    return NextResponse.json(
      { error: "Falta OPENAI_API_KEY en el servidor." },
      { status: 503 },
    );
  }

  if (!scenario) {
    return NextResponse.json({ error: "Esa escena no existe." }, { status: 400 });
  }

  const sdp = await request.text();

  if (!sdp) {
    return NextResponse.json({ error: "La oferta SDP está vacía." }, { status: 400 });
  }

  const sessionConfig = {
    type: "realtime",
    model: process.env.OPENAI_REALTIME_MODEL ?? "gpt-realtime-2.1",
    instructions: createConversationPrompt(level, scenario),
    audio: {
      input: {
        // Phones and laptop speakers leak the assistant's voice back into the
        // mic; filtering it and waiting for a finished thought keeps the model
        // from treating its own speech as a user turn.
        noise_reduction: { type: "far_field" },
        turn_detection: {
          type: "semantic_vad",
          eagerness: "low",
        },
        transcription: {
          model: process.env.OPENAI_TRANSCRIPTION_MODEL ?? "gpt-4o-transcribe",
          // No language lock: the user switches to English to ask questions.
          prompt:
            `${scenario.eyebrow.toLowerCase()} en México. Cliente hablando español como principiante. A veces dice en inglés: Let's pause and switch to English, Let's resume.`,
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
