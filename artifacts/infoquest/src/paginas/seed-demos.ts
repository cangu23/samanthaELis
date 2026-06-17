import { db, retosTable, preguntasTable, modulosTable, nivelesTable } from "@workspace/db";
import { eq } from "drizzle-orm";

async function seed() {
  console.log("🌱 Generando juegos de demostración...");

  // Aseguramos un módulo para las demos
  let [modulo] = await db.select().from(modulosTable).where(eq(modulosTable.nombre, "Demos")).limit(1);
  if (!modulo) {
    [modulo] = await db.insert(modulosTable).values({
      nombre: "Demos",
      descripcion: "Retos introductorios",
      anio_bachillerato: 1,
      orden: 0
    }).returning();
  }

  let [nivel] = await db.select().from(nivelesTable).where(eq(nivelesTable.id_modulo, modulo.id)).limit(1);
  if (!nivel) {
    [nivel] = await db.insert(nivelesTable).values({
      id_modulo: modulo.id,
      nombre: "Demo Inicial",
      descripcion: "Explora la plataforma",
      orden: 1,
      requisito_puntos: 0
    }).returning();
  }

  const demos = [
    {
      nombre: "Fundamentos Pro (Quiz)",
      tipo: "quiz",
      desc: "Variables y estructuras de control.",
      preguntas: [
        { q: "¿Qué estructura se usa para repetir código?", opts: ["if", "for", "switch", "def"], a: "for" },
        { q: "Resultado de 10 % 3", opts: ["1", "3", "0", "10"], a: "1" }
      ]
    },
    {
      nombre: "Cazador de Bugs (Debug)",
      tipo: "code_challenge",
      desc: "Encuentra errores de sintaxis.",
      preguntas: [
        { q: "Falta algo en: print('Hola' + 5)", opts: ["Error de tipo", "Falta punto y coma", "Variable no definida"], a: "Error de tipo" }
      ]
    },
    {
      nombre: "Ciber-Defensa (Security)",
      tipo: "security_puzzle",
      desc: "Seguridad básica para todos.",
      preguntas: [
        { q: "¿Qué es el Phishing?", opts: ["Virus", "Suplantación de identidad", "Hardware", "Un juego"], a: "Suplantación de identidad" }
      ]
    },
    {
      nombre: "Lógica de Pasos (Orden)",
      tipo: "drag_drop",
      desc: "Ordena el flujo de un algoritmo.",
      preguntas: [
        { q: "Ordena: 1.Inicio, 2.Proceso, 3.Fin", opts: ["1-2-3", "3-2-1", "2-1-3"], a: "1-2-3" }
      ]
    },
    {
      nombre: "Carrera de Bits (Speed)",
      tipo: "speed_race",
      desc: "¡Responde rápido!",
      preguntas: [
        { q: "Unidad mínima de información", opts: ["Byte", "Bit", "Hertz", "Pixel"], a: "Bit" }
      ]
    }
  ];

  for (const demo of demos) {
    const [reto] = await db.insert(retosTable).values({
      nombre: demo.nombre,
      descripcion: demo.desc,
      tipo_juego: demo.tipo,
      id_modulo: modulo.id,
      id_nivel: nivel.id,
      tiempo_limite: 300,
      puntos_maximos: demo.preguntas.length * 10,
      numero_preguntas: demo.preguntas.length,
      is_custom: false
    }).returning();

    for (const p of demo.preguntas) {
      await db.insert(preguntasTable).values({
        id_reto: reto.id,
        texto: p.q,
        tipo: "multiple_choice",
        opciones: p.opts,
        respuesta_correcta: p.a,
        puntos: 10,
        dificultad: "medio"
      });
    }
  }

  console.log("✅ Demos creadas con éxito.");
  process.exit(0);
}

seed();