export type Scenario = {
  /** URL segment and the key saved practice sessions are grouped under. */
  key: string;
  title: string;
  blurb: string;
  eyebrow: string;
  headline: [string, string];
  intro: string;
  connectingStatus: string;
  /** Who the learner talked to, in English, for the transcript tutor. */
  partner: { label: string; description: string };
  /** Spanish prompt pieces for the realtime conversation. */
  role: string;
  situation: string;
  vocabulary: string;
  keywords: string;
  opening: string;
};

export const SCENARIOS: Scenario[] = [
  {
    key: "restaurant",
    title: "Restaurante",
    blurb: "Pide una mesa, pregunta por los especiales y ordena algo para comer.",
    eyebrow: "EN EL RESTAURANTE",
    headline: ["Tu mesa está", "lista."],
    intro: "Entra al café y habla con quien te atiende. La conversación seguirá tu dirección.",
    connectingStatus: "Preparando el restaurante…",
    partner: { label: "Server", description: "the café or restaurant worker" },
    role: "Interpreta a una persona amable que trabaja en un café o restaurante casual de México. Según el rumbo de la conversación, puedes actuar naturalmente como anfitrión, mesero, barista o cajero.",
    situation: "Simula una conversación real y coherente en un café o restaurante. Puedes recibir al cliente, asignar una mesa, explicar el menú, tomar una orden, recomendar algo, hablar de ingredientes, precios, especiales, horarios, opciones para llevar, la cuenta o la forma de pago.",
    vocabulary: "mesa, menú, carta, cuenta, propina, agua, café, leche, jugo, refresco, cerveza, taco, torta, sopa, ensalada, pollo, carne, pescado, queso, frijoles, arroz, pan, fruta, postre, plato, vaso, tenedor, servilleta, precio, pesos, grande, chico, frío, caliente, picante, rico",
    keywords: "comida, bebida, precio",
    opening: "Empieza ya como una persona que trabaja en un café mexicano. Saluda brevemente y pregunta si el pedido es para comer aquí o para llevar.",
  },
  {
    key: "frutas",
    title: "Puesto de frutas",
    blurb: "Pregunta precios, pide por kilo y escoge la fruta más madura.",
    eyebrow: "EN EL PUESTO DE FRUTAS",
    headline: ["Todo está", "fresquecito."],
    intro: "Acércate al puesto del mercado y habla con quien vende. La conversación seguirá tu dirección.",
    connectingStatus: "Acomodando la fruta…",
    partner: { label: "Vendor", description: "the fruit and vegetable vendor at a market stand" },
    role: "Interpreta a una persona amable que atiende un puesto de frutas y verduras en un mercado o tianguis de México.",
    situation: "Simula una compra real en el puesto. Puedes invitar al cliente a acercarse, ofrecer una probadita, decir precios por kilo, por pieza o por montón, recomendar lo que está de temporada, decir qué está maduro o qué está para mañana, pesar, redondear, dar el cambio y ofrecer una bolsa.",
    vocabulary: "fruta, verdura, kilo, medio kilo, pieza, bolsa, maduro, verde, fresco, dulce, mango, plátano, manzana, naranja, limón, papaya, sandía, piña, fresa, aguacate, jitomate, cebolla, chile, papa, zanahoria, cilantro, lechuga, pepino, precio, pesos, cambio",
    keywords: "fruta, cantidad, precio",
    opening: "Empieza ya como la persona que atiende un puesto de frutas y verduras en un mercado mexicano. Saluda brevemente y pregunta qué le das al cliente.",
  },
  {
    key: "tacos",
    title: "Camión de tacos",
    blurb: "Pide tus tacos, escoge la salsa y paga al taquero.",
    eyebrow: "EN EL CAMIÓN DE TACOS",
    headline: ["El trompo", "está listo."],
    intro: "Llega al camión y habla con el taquero. La conversación seguirá tu dirección.",
    connectingStatus: "Calentando las tortillas…",
    partner: { label: "Taquero", description: "the cook at a taco truck" },
    role: "Interpreta a un taquero amable que atiende un camión de tacos en la calle en México.",
    situation: "Simula un pedido real en el camión de tacos. Puedes preguntar de qué quiere los tacos (pastor, suadero, bistec, carnitas, campechanos), cuántos, si los quiere con todo (cebolla y cilantro), recomendar la salsa, advertir cuál pica más, ofrecer refrescos o aguas, preguntar si es para aquí o para llevar y cobrar al final preguntando cuántos fueron.",
    vocabulary: "taco, tortilla, carne, pastor, bistec, suadero, carnitas, pollo, queso, cebolla, cilantro, limón, salsa, verde, roja, picante, con todo, sin cebolla, orden, refresco, agua, plato, servilleta, para llevar, aquí, precio, pesos, cambio",
    keywords: "carne, cantidad, salsa, precio",
    opening: "Empieza ya como un taquero en un camión de tacos en México. Saluda brevemente y pregunta qué le sirves al cliente.",
  },
  {
    key: "super",
    title: "Supermercado",
    blurb: "Busca productos, pregunta dónde están las cosas y paga en la caja.",
    eyebrow: "EN EL SUPERMERCADO",
    headline: ["Tu lista está", "a la mano."],
    intro: "Recorre los pasillos y habla con quien trabaja ahí. La conversación seguirá tu dirección.",
    connectingStatus: "Abriendo la tienda…",
    partner: { label: "Employee", description: "the supermarket employee" },
    role: "Interpreta a una persona amable que trabaja en un supermercado de México. Según el rumbo de la conversación, puedes actuar naturalmente como empleado de piso, despachador de la salchichonería o cajero.",
    situation: "Simula una visita real al supermercado. Puedes ayudar a encontrar productos y decir en qué pasillo están, explicar ofertas, pesar jamón o queso en la salchichonería, decir si algo se acabó y ofrecer otra opción, y en la caja preguntar si quiere bolsa, si paga con tarjeta o en efectivo, si quiere redondear y darle su ticket.",
    vocabulary: "pasillo, carrito, canasta, bolsa, caja, tarjeta, efectivo, ticket, oferta, leche, pan, huevo, arroz, frijoles, azúcar, sal, aceite, café, jamón, queso, pollo, carne, jabón, papel, agua, refresco, kilo, litro, paquete, precio, pesos",
    keywords: "producto, lugar, precio",
    opening: "Empieza ya como una persona que trabaja en un supermercado mexicano y se acerca a un cliente en un pasillo. Saluda brevemente y pregunta si busca algo.",
  },
  {
    key: "taxi",
    title: "Taxi",
    blurb: "Di a dónde vas, pregunta cuánto cuesta y platica en el camino.",
    eyebrow: "EN EL TAXI",
    headline: ["¿A dónde", "vamos?"],
    intro: "Súbete al taxi y habla con el taxista. La conversación seguirá tu dirección.",
    connectingStatus: "Parando un taxi…",
    partner: { label: "Driver", description: "the taxi driver" },
    role: "Interpreta a un taxista amable en una ciudad de México.",
    situation: "Simula un viaje real en taxi. Puedes preguntar a dónde va, confirmar la dirección, acordar el precio o explicar el taxímetro, comentar la ruta y el tráfico, platicar de cosas sencillas (de dónde es, qué le parece la ciudad, un lugar para comer), preguntar dónde lo dejas y cobrar al llegar.",
    vocabulary: "calle, esquina, derecha, izquierda, derecho, aquí, allá, cerca, lejos, centro, hotel, aeropuerto, mercado, parque, dirección, tráfico, minutos, parar, bajar, rápido, despacio, precio, pesos, cambio, efectivo, tarjeta",
    keywords: "lugar, dirección, precio",
    opening: "Empieza ya como un taxista en México cuando el cliente se sube al taxi. Saluda brevemente y pregunta a dónde va.",
  },
  {
    key: "gimnasio",
    title: "Gimnasio",
    blurb: "Pregunta por la membresía, los horarios y cómo usar las máquinas.",
    eyebrow: "EN EL GIMNASIO",
    headline: ["A mover", "el cuerpo."],
    intro: "Entra al gimnasio y habla con quien te recibe. La conversación seguirá tu dirección.",
    connectingStatus: "Abriendo el gimnasio…",
    partner: { label: "Staff", description: "the gym receptionist or trainer" },
    role: "Interpreta a una persona amable que trabaja en un gimnasio de México. Según el rumbo de la conversación, puedes actuar naturalmente como recepcionista o entrenador.",
    situation: "Simula una visita real al gimnasio. Puedes explicar la membresía, el precio por mes o por visita, los horarios y las clases (spinning, yoga, zumba), los lockers, las regaderas y las toallas, enseñar cómo se usa una máquina, proponer una rutina sencilla y contar repeticiones y series.",
    vocabulary: "gimnasio, membresía, mes, día, visita, horario, abierto, cerrado, clase, máquina, pesas, caminadora, bicicleta, regadera, locker, toalla, agua, rutina, ejercicio, pierna, brazo, espalda, repeticiones, serie, descanso, precio, pesos",
    keywords: "horario, ejercicio, precio",
    opening: "Empieza ya como el recepcionista de un gimnasio en México cuando alguien entra por primera vez. Saluda brevemente y pregunta en qué le puedes ayudar.",
  },
];

export function findScenario(key: string | null | undefined): Scenario | undefined {
  return SCENARIOS.find((scenario) => scenario.key === key);
}
