"""
Racha API — backend del prototipo de Design Thinking.

Lleva la lógica real del concepto: racha diaria con gracia de 3 días,
XP acumulado, procedimientos que suben de nivel (y el último nivel
("a prueba de ausencias") solo se otorga a mano, nunca automáticamente,
porque esa validación la hace una persona de otro sector, no la app),
y una liga semanal entre sectores.

Corre con: uvicorn main:app --reload --port 8000
Datos de ejemplo — no son datos reales de la Defensoría del Pueblo de CABA.
"""
from datetime import date, datetime, timedelta
from pathlib import Path
import sqlite3
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

DB_PATH = Path(__file__).parent / "racha.db"
app = FastAPI(title="Racha API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # prototipo: en producción, restringir al dominio del frontend
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# datos de ejemplo (semilla) — mismas unidades/lecciones del prototipo HTML
# ---------------------------------------------------------------------------
UNIDADES = [
    {"id": 0, "nombre": "Mesa de Ayuda", "color": "#1cb0f6", "colorSh": "#1899d6"},
    {"id": 1, "nombre": "Desarrollo", "color": "#ce82ff", "colorSh": "#a568c9"},
    {"id": 2, "nombre": "Infraestructura", "color": "#ff9600", "colorSh": "#e78800"},
    {"id": 3, "nombre": "Networking", "color": "#58cc02", "colorSh": "#4caf00"},
]

LECCIONES = [
    {"id": 0, "u": 0, "o": "OTRS #4871", "min": 3, "xp": 10,
     "t": "Resolviste el pedido del área jurídica. Escribí en tres líneas quién autoriza ese tipo de pedido.",
     "tipo": "texto",
     "r": "«Criterio de derivación» pasó de sin escribir a borrador.",
     "cita": "“Yo hago como un criterio de ‘esto no, pasalo para arriba’... y no está escrito en ningún lado.” — Leandro Centurión"},
    {"id": 1, "u": 0, "o": "Guardia de hoy", "min": 1, "xp": 8,
     "t": "¿Seguís usando el mismo criterio de la semana pasada para derivar un ticket a nivel 2, o cambió algo?",
     "tipo": "opcion", "ops": ["Sigue igual, ningún cambio", "Cambió algo y lo tengo que anotar"],
     "r": "Quedó registrado como vigente. Suma a la racha del sector igual que si lo hubieras escrito.", "cita": None},
    {"id": 2, "u": 0, "o": "Procedimiento BK-02", "min": 1, "xp": 8,
     "t": "Hace 40 días que nadie toca el procedimiento de restauración de backup. ¿Sigue vigente?",
     "tipo": "opcion", "ops": ["Sí, sigue vigente tal cual", "No, hay que actualizarlo"],
     "r": "Quedó revisado. Si nadie lo objeta en 7 días, sube a Probado.", "cita": None},
    {"id": 3, "u": 1, "o": "Release de hoy", "min": 2, "xp": 10,
     "t": "Hiciste un tag de versión. Escribí el paso que siempre hacés antes de taggear y que nadie más sabe que hacés.",
     "tipo": "texto",
     "r": "«Versionado y tag de release» ganó un paso que antes solo sabía Ramina.",
     "cita": "“Yo tengo mi forma de hacerlo, pero si me preguntás si está escrito en algún lado, no.” — Ramina Pontiroli"},
    {"id": 4, "u": 1, "o": "OTRS · 6 tickets", "min": 4, "xp": 12,
     "t": "Cerraste seis tickets de VPN esta semana. ¿Hay un paso que repetís siempre y que no está en el instructivo?",
     "tipo": "texto", "r": "El instructivo de VPN sumó un paso. Ya lo usaron 3 personas desde entonces.", "cita": None},
    {"id": 5, "u": 1, "o": "Pasaje a producción", "min": 3, "xp": 10,
     "t": "¿El paso a producción de hoy salió como marca el instructivo, o tuviste que improvisar algo?",
     "tipo": "opcion", "ops": ["Salió tal cual el instructivo", "Improvisé un paso que falta"],
     "r": "Anotado. Si improvisaste algo, mañana te lo volvemos a preguntar para que lo termines de escribir.", "cita": None},
    {"id": 6, "u": 2, "o": "Sin registro", "min": 5, "xp": 14,
     "t": "El procedimiento de contingencia por corte de luz no existe. Escribí solo el primer paso, nada más.",
     "tipo": "texto", "r": "«Contingencia por corte de luz» dejó de estar en cero por primera vez.",
     "cita": "“Ese día no sabíamos ni a quién llamar primero.” — Germán Perrone"},
    {"id": 7, "u": 2, "o": "Alta con Ansible", "min": 2, "xp": 10,
     "t": "¿El playbook de alta de entorno corrió sin tocar nada a mano, o tuviste que meter la mano en algún paso?",
     "tipo": "opcion", "ops": ["Corrió solo, cero intervención", "Tuve que tocar un paso a mano"],
     "r": "Si tuviste que intervenir, ese paso queda marcado para revisar antes de la próxima prueba de fuego.", "cita": None},
    {"id": 8, "u": 2, "o": "Parte de licencias", "min": 2, "xp": 10,
     "t": "Si faltás mañana, ¿quién hace el monitoreo de la mañana y qué paso le faltaría saber?",
     "tipo": "texto", "r": "Se anotó el reemplazo. «Monitoreo MN-01» queda a un paso de la prueba de fuego.", "cita": None},
    {"id": 9, "u": 3, "o": "Corte de enlace", "min": 3, "xp": 12,
     "t": "Un enlace entre sedes se cayó y se resolvió. Contá en dos líneas cómo se detectó, antes de que se te olvide el detalle.",
     "tipo": "texto", "r": "«Corte de enlace entre sedes» subió de Sin escribir a Borrador.", "cita": None},
    {"id": 10, "u": 3, "o": "Checkeo semanal", "min": 1, "xp": 8,
     "t": "¿Los switches de la sala de servidores están identificados con etiqueta legible, o hay alguno que solo vos reconocés?",
     "tipo": "opcion", "ops": ["Todos etiquetados y legibles", "Hay alguno que solo reconozco yo"],
     "r": "Si hay uno sin etiqueta clara, mañana te pedimos que le pongas nombre.", "cita": None},
]

PROCEDIMIENTOS = [
    {"n": "Alta de usuario en el dominio", "s": "Mesa de Ayuda", "a": "Leandro C.", "u": 23, "l": 5},
    {"n": "Versionado y tag de release", "s": "Desarrollo", "a": "Ramina P.", "u": 19, "l": 5},
    {"n": "Restauración de backup", "s": "Infraestructura", "a": "Germán P.", "u": 8, "l": 4},
    {"n": "Pasaje a producción", "s": "Desarrollo", "a": "Ramina P.", "u": 15, "l": 4},
    {"n": "Criterio de derivación nivel 1 a 2", "s": "Mesa de Ayuda", "a": "—", "u": 0, "l": 1},
    {"n": "Contingencia por corte de luz", "s": "Infraestructura", "a": "—", "u": 1, "l": 2},
]

SECTORES_LIGA = [
    {"s": "Mesa de Ayuda", "xp_base": 340, "racha_base": 12, "me": True},
    {"s": "Desarrollo", "xp_base": 295, "racha_base": 9},
    {"s": "Networking", "xp_base": 230, "racha_base": 12},
    {"s": "Infraestructura", "xp_base": 180, "racha_base": 4},
    {"s": "Depósito y Archivo", "xp_base": 95, "racha_base": 2},
]

# ---------------------------------------------------------------------------
# base de datos
# ---------------------------------------------------------------------------
def get_db():
    con = sqlite3.connect(DB_PATH)
    con.row_factory = sqlite3.Row
    return con


def init_db():
    con = get_db()
    con.execute("""CREATE TABLE IF NOT EXISTS estado (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        racha INTEGER NOT NULL,
        xp INTEGER NOT NULL,
        actual INTEGER NOT NULL,
        ultima_fecha TEXT,
        dias_salteados INTEGER NOT NULL DEFAULT 0
    )""")
    con.execute("""CREATE TABLE IF NOT EXISTS completadas (
        leccion_id INTEGER PRIMARY KEY,
        fecha TEXT NOT NULL,
        respuesta TEXT
    )""")
    row = con.execute("SELECT 1 FROM estado WHERE id = 1").fetchone()
    if not row:
        con.execute(
            "INSERT INTO estado (id, racha, xp, actual, ultima_fecha, dias_salteados) VALUES (1, 12, 340, 2, ?, 0)",
            ((date.today() - timedelta(days=1)).isoformat(),),
        )
        for lid in (0, 1):
            con.execute(
                "INSERT OR IGNORE INTO completadas (leccion_id, fecha, respuesta) VALUES (?, ?, ?)",
                (lid, (date.today() - timedelta(days=2)).isoformat(), "(lección de ejemplo ya completada)"),
            )
        con.commit()
    con.close()


init_db()


# ---------------------------------------------------------------------------
# modelos
# ---------------------------------------------------------------------------
class CompletarPayload(BaseModel):
    respuesta: str


# ---------------------------------------------------------------------------
# lógica de racha: gracia de 3 días sin cortar, como se le explicó al usuario
# en la app ("la racha se corta a los tres días seguidos sin cumplir, no al
# primero"). Se evalúa cada vez que se pide el estado.
# ---------------------------------------------------------------------------
def evaluar_racha(con):
    row = con.execute("SELECT * FROM estado WHERE id = 1").fetchone()
    hoy = date.today()
    ultima = date.fromisoformat(row["ultima_fecha"]) if row["ultima_fecha"] else None
    if ultima is None:
        return
    gap = (hoy - ultima).days
    if gap > 3:
        con.execute("UPDATE estado SET racha = 0 WHERE id = 1")
        con.commit()


@app.get("/api/estado")
def api_estado():
    con = get_db()
    evaluar_racha(con)
    row = con.execute("SELECT * FROM estado WHERE id = 1").fetchone()
    completadas = [r["leccion_id"] for r in con.execute("SELECT leccion_id FROM completadas")]
    con.close()
    return {
        "racha": row["racha"],
        "xp": row["xp"],
        "actual": row["actual"],
        "completadas": completadas,
        "unidades": UNIDADES,
        "lecciones": LECCIONES,
    }


@app.post("/api/lecciones/{leccion_id}/completar")
def api_completar(leccion_id: int, payload: CompletarPayload):
    leccion = next((l for l in LECCIONES if l["id"] == leccion_id), None)
    if leccion is None:
        raise HTTPException(404, "Lección no encontrada")
    if not payload.respuesta or len(payload.respuesta.strip()) < 2:
        raise HTTPException(400, "La respuesta está vacía")

    con = get_db()
    ya_hecha = con.execute(
        "SELECT 1 FROM completadas WHERE leccion_id = ?", (leccion_id,)
    ).fetchone()
    row = con.execute("SELECT * FROM estado WHERE id = 1").fetchone()
    hoy = date.today()

    if not ya_hecha:
        con.execute(
            "INSERT INTO completadas (leccion_id, fecha, respuesta) VALUES (?, ?, ?)",
            (leccion_id, hoy.isoformat(), payload.respuesta.strip()),
        )
        ultima = date.fromisoformat(row["ultima_fecha"]) if row["ultima_fecha"] else None
        nueva_racha = row["racha"]
        if ultima is None or ultima < hoy:
            # ya pasó al menos un día desde la última lección -> suma racha
            nueva_racha = row["racha"] + 1 if (ultima is None or (hoy - ultima).days <= 3) else 1
        nuevo_actual = max(row["actual"], leccion_id + 1)
        nuevo_actual = min(nuevo_actual, len(LECCIONES) - 1)
        con.execute(
            "UPDATE estado SET racha = ?, xp = xp + ?, actual = ?, ultima_fecha = ? WHERE id = 1",
            (nueva_racha, leccion["xp"], nuevo_actual, hoy.isoformat()),
        )
        con.commit()

    row = con.execute("SELECT * FROM estado WHERE id = 1").fetchone()
    con.close()
    return {
        "resultado": leccion["r"],
        "cita": leccion["cita"],
        "xp_ganado": leccion["xp"],
        "racha": row["racha"],
        "xp_total": row["xp"],
        "ya_estaba_hecha": bool(ya_hecha),
    }


@app.get("/api/procedimientos")
def api_procedimientos():
    return PROCEDIMIENTOS


@app.get("/api/liga")
def api_liga():
    con = get_db()
    row = con.execute("SELECT racha, xp FROM estado WHERE id = 1").fetchone()
    con.close()
    tabla = []
    for sector in SECTORES_LIGA:
        if sector.get("me"):
            tabla.append({"s": sector["s"], "xp": row["xp"], "r": row["racha"], "me": True})
        else:
            tabla.append({"s": sector["s"], "xp": sector["xp_base"], "r": sector["racha_base"]})
    tabla.sort(key=lambda s: -s["xp"])
    return tabla


@app.get("/api/salud")
def salud():
    return {"ok": True, "hoy": date.today().isoformat()}
