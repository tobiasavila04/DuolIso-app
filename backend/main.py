"""
DuolISO API — backend del prototipo "DuolISO" (idea 3 del TP de Design
Thinking, caso Defensoría del Pueblo de CABA).

Lleva la lógica real del concepto: racha diaria con días comodín para
urgencias y vacaciones, XP acumulado, procedimientos que suben de nivel (y el
último nivel, "a prueba de ausencias", solo se otorga a mano —en la prueba de
fuego mensual o en un simulacro de ausencia—, nunca automáticamente), y el
progreso hacia una meta trimestral COMPARTIDA entre sectores.

Ojo con esto último: a propósito no es un ranking. El TP es explícito en que
DuolISO reemplaza "un ranking que exponga a los equipos" por un objetivo en
común donde cada sector se compara contra su propio historial, nunca contra
los demás — así se involucra a la dirección sin exponer a nadie.

Corre con: python -m uvicorn main:app --reload --port 8000
Datos de ejemplo — no son datos reales de la Defensoría del Pueblo de CABA.

Decisiones de seguridad/arquitectura, explicadas porque en un TP esto
también se defiende:

- CORS restringido a una lista explícita de orígenes (nunca "*"), configurable
  por entorno en vez de hardcodeada.
- Toda entrada de usuario pasa por un modelo Pydantic con límites de longitud
  y sin HTML/control characters — no porque React sea vulnerable a XSS
  (escapa por defecto), sino porque el backend no debería confiar en que el
  único cliente sea ese frontend.
- Las consultas SQL son siempre parametrizadas (placeholders "?"), nunca
  f-strings con datos del usuario — así se evita inyección SQL.
- Las respuestas usan `response_model` de Pydantic: la API solo puede
  devolver los campos declarados, así nunca se filtra por error algo interno.
- Rate limiting básico por IP, para que nadie pueda hacer spam de requests.
- Manejador de errores genérico: los errores no esperados nunca exponen el
  traceback ni detalles internos al cliente, solo quedan en el log del
  servidor.
- No hay autenticación: es un prototipo de una sola persona/sector de
  ejemplo. Si este sistema se usara con más de un sector real, el próximo
  paso sería login (JWT o sesión) y que `sector_id` salga del usuario
  autenticado, no de una fila fija en la base.
"""
import logging
import re
import sqlite3
from contextlib import contextmanager
from datetime import date, timedelta
from pathlib import Path
from typing import Literal, Optional

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, field_validator
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from config import get_settings

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("racha")

settings = get_settings()
DB_PATH = Path(settings.db_path)

limiter = Limiter(key_func=get_remote_address)
app = FastAPI(title="DuolISO API", docs_url=None if settings.es_produccion else "/docs")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins_list,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


@app.middleware("http")
async def security_headers(request: Request, call_next):
    """Cabeceras básicas que cualquier API debería mandar, para que el
    navegador del cliente no haga cosas que no corresponden con la respuesta
    (adivinar un content-type, embeberla en un iframe ajeno, etc.)."""
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "no-referrer"
    return response


@app.exception_handler(Exception)
async def error_inesperado(request: Request, exc: Exception):
    """Nunca devolver un traceback al cliente: se loguea acá, server-side,
    y al cliente le llega un mensaje genérico."""
    log.exception("Error no manejado en %s", request.url.path)
    return JSONResponse(status_code=500, content={"detail": "Error interno. Probá de nuevo en un momento."})


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
LECCIONES_POR_ID = {l["id"]: l for l in LECCIONES}

PROCEDIMIENTOS = [
    {"n": "Alta de usuario en el dominio", "s": "Mesa de Ayuda", "a": "Vos", "u": 23, "l": 5, "mio": True},
    {"n": "Criterio de derivación nivel 1 a 2", "s": "Mesa de Ayuda", "a": "Vos", "u": 6, "l": 3, "mio": True},
    {"n": "Reinicio de servicio OTRS", "s": "Mesa de Ayuda", "a": "Vos", "u": 4, "l": 2, "mio": True},
    {"n": "Versionado y tag de release", "s": "Desarrollo", "a": "Ramina P.", "u": 19, "l": 5, "mio": False},
    {"n": "Restauración de backup", "s": "Infraestructura", "a": "Germán P.", "u": 8, "l": 4, "mio": False},
    {"n": "Pasaje a producción", "s": "Desarrollo", "a": "Ramina P.", "u": 15, "l": 4, "mio": False},
    {"n": "Contingencia por corte de luz", "s": "Infraestructura", "a": "—", "u": 1, "l": 2, "mio": False},
]

# Meta común entre sectores — a propósito, esto NO es un ranking. El TP es
# explícito en este punto: "en lugar de un ranking que exponga a los equipos
# [...] cada sector se compara con su propio historial". Cada sector suma al
# mismo objetivo trimestral y se mide contra sí mismo, nunca contra los demás.
META_TRIMESTRAL = 20  # procedimientos "a prueba de ausencias" en el trimestre, entre todos los sectores

SECTORES_META = [
    {"s": "Mesa de Ayuda", "logrado_base": 6, "trimestre_anterior": 3, "me": True},
    {"s": "Desarrollo", "logrado_base": 5, "trimestre_anterior": 4},
    {"s": "Infraestructura", "logrado_base": 3, "trimestre_anterior": 2},
    {"s": "Networking", "logrado_base": 2, "trimestre_anterior": 1},
]

# ---------------------------------------------------------------------------
# base de datos
# ---------------------------------------------------------------------------
@contextmanager
def db_session():
    """Context manager: garantiza que la conexión se cierre siempre, incluso
    si algo tira una excepción a mitad de camino."""
    con = sqlite3.connect(DB_PATH)
    con.row_factory = sqlite3.Row
    try:
        yield con
    finally:
        con.close()


def init_db():
    with db_session() as con:
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


init_db()


# ---------------------------------------------------------------------------
# modelos — entrada validada y salida tipada (nunca se filtra un campo de más)
# ---------------------------------------------------------------------------
_CONTROL_CHARS = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f]")


class CompletarPayload(BaseModel):
    respuesta: str = Field(min_length=2, max_length=500)

    @field_validator("respuesta")
    @classmethod
    def limpiar(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("La respuesta está vacía")
        if _CONTROL_CHARS.search(v):
            raise ValueError("La respuesta tiene caracteres inválidos")
        return v


class Unidad(BaseModel):
    id: int
    nombre: str
    color: str
    colorSh: str


class Leccion(BaseModel):
    id: int
    u: int
    o: str
    min: int
    xp: int
    t: str
    tipo: Literal["texto", "opcion"]
    ops: Optional[list[str]] = None
    r: str
    cita: Optional[str] = None


class Estado(BaseModel):
    racha: int
    xp: int
    actual: int
    completadas: list[int]
    unidades: list[Unidad]
    lecciones: list[Leccion]


class ResultadoLeccion(BaseModel):
    resultado: str
    cita: Optional[str] = None
    xp_ganado: int
    racha: int
    xp_total: int
    ya_estaba_hecha: bool


class Procedimiento(BaseModel):
    n: str
    s: str
    a: str
    u: int
    l: int
    mio: bool = False


class Impacto(BaseModel):
    procedimientos_tuyos: int
    veces_usados_por_otros: int
    horas_ahorradas_estimadas: int
    nivel_maximo_alcanzado: int
    racha_mas_larga: int


class NivelConteo(BaseModel):
    nivel: int
    nombre: str
    cantidad: int


class LogroReciente(BaseModel):
    procedimiento: str
    sector: str
    como: str  # "prueba de fuego" | "simulacro de ausencia"
    cuando: str


class Direccion(BaseModel):
    meta_trimestral: int
    logrado_total: int
    participacion_hoy_pct: int
    niveles: list[NivelConteo]
    proxima_prueba_de_fuego: str
    logros_recientes: list[LogroReciente]


class SectorMeta(BaseModel):
    s: str
    logrado: int
    trimestre_anterior: int
    me: Optional[bool] = None


class MetaComun(BaseModel):
    meta_trimestral: int
    logrado_total: int
    sectores: list[SectorMeta]


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


@app.get("/api/estado", response_model=Estado)
@limiter.limit(settings.rate_limit)
def api_estado(request: Request):
    with db_session() as con:
        evaluar_racha(con)
        row = con.execute("SELECT * FROM estado WHERE id = 1").fetchone()
        completadas = [r["leccion_id"] for r in con.execute("SELECT leccion_id FROM completadas")]
    return {
        "racha": row["racha"],
        "xp": row["xp"],
        "actual": row["actual"],
        "completadas": completadas,
        "unidades": UNIDADES,
        "lecciones": LECCIONES,
    }


@app.post("/api/lecciones/{leccion_id}/completar", response_model=ResultadoLeccion)
@limiter.limit(settings.rate_limit)
def api_completar(request: Request, leccion_id: int, payload: CompletarPayload):
    leccion = LECCIONES_POR_ID.get(leccion_id)
    if leccion is None:
        raise HTTPException(404, "Lección no encontrada")

    with db_session() as con:
        ya_hecha = con.execute(
            "SELECT 1 FROM completadas WHERE leccion_id = ?", (leccion_id,)
        ).fetchone()
        row = con.execute("SELECT * FROM estado WHERE id = 1").fetchone()
        hoy = date.today()

        if not ya_hecha:
            con.execute(
                "INSERT INTO completadas (leccion_id, fecha, respuesta) VALUES (?, ?, ?)",
                (leccion_id, hoy.isoformat(), payload.respuesta),
            )
            ultima = date.fromisoformat(row["ultima_fecha"]) if row["ultima_fecha"] else None
            nueva_racha = row["racha"]
            if ultima is None or ultima < hoy:
                nueva_racha = row["racha"] + 1 if (ultima is None or (hoy - ultima).days <= 3) else 1
            nuevo_actual = min(max(row["actual"], leccion_id + 1), len(LECCIONES) - 1)
            con.execute(
                "UPDATE estado SET racha = ?, xp = xp + ?, actual = ?, ultima_fecha = ? WHERE id = 1",
                (nueva_racha, leccion["xp"], nuevo_actual, hoy.isoformat()),
            )
            con.commit()

        row = con.execute("SELECT * FROM estado WHERE id = 1").fetchone()

    return {
        "resultado": leccion["r"],
        "cita": leccion["cita"],
        "xp_ganado": leccion["xp"],
        "racha": row["racha"],
        "xp_total": row["xp"],
        "ya_estaba_hecha": bool(ya_hecha),
    }


@app.get("/api/procedimientos", response_model=list[Procedimiento])
@limiter.limit(settings.rate_limit)
def api_procedimientos(request: Request):
    return PROCEDIMIENTOS


@app.get("/api/impacto", response_model=Impacto)
@limiter.limit(settings.rate_limit)
def api_impacto(request: Request):
    """Responde directamente al hallazgo 1 del TP: 'el beneficio son
    problemas que no llegaron a pasar, así que no se ve'. Esta pantalla
    existe para que esa parte invisible del trabajo de la persona se note."""
    with db_session() as con:
        lecciones_hechas = con.execute("SELECT COUNT(*) AS c FROM completadas").fetchone()["c"]
        row = con.execute("SELECT racha FROM estado WHERE id = 1").fetchone()

    mios = [p for p in PROCEDIMIENTOS if p.get("mio")]
    return {
        "procedimientos_tuyos": len(mios),
        "veces_usados_por_otros": sum(p["u"] for p in mios),
        # estimación de ejemplo: cada lección evitó, en promedio, que alguien
        # perdiera media hora preguntando o reconstruyendo el paso a mano
        "horas_ahorradas_estimadas": round(lecciones_hechas * 0.5 + sum(p["u"] for p in mios) * 0.25),
        "nivel_maximo_alcanzado": max((p["l"] for p in mios), default=0),
        "racha_mas_larga": max(row["racha"], 19),
    }


@app.get("/api/direccion", response_model=Direccion)
@limiter.limit(settings.rate_limit)
def api_direccion(request: Request):
    """Panel pensado para la reunión de coordinadores: agregado, nunca por
    persona — ni siquiera por sector con nombre y apellido. El TP es claro en
    que esto es lo que se muestra para involucrar a la dirección 'sin exigirle
    todavía ningún compromiso', no una herramienta de control individual."""
    with db_session() as con:
        row = con.execute("SELECT racha, xp FROM estado WHERE id = 1").fetchone()
        completadas_hoy = con.execute(
            "SELECT COUNT(*) AS c FROM completadas WHERE fecha = ?", (date.today().isoformat(),)
        ).fetchone()["c"]

    nombres_nivel = {1: "Sin escribir", 2: "Borrador", 3: "Escrito", 4: "Probado", 5: "A prueba de ausencias"}
    conteo = {n: 0 for n in range(1, 6)}
    for p in PROCEDIMIENTOS:
        conteo[p["l"]] += 1
    niveles = [{"nivel": n, "nombre": nombres_nivel[n], "cantidad": conteo[n]} for n in range(1, 6)]

    logrado_total = sum(
        s["logrado_base"] + (1 if s.get("me") and row["racha"] > 12 else 0) for s in SECTORES_META
    )

    logros_recientes = [
        {"procedimiento": "Alta de usuario en el dominio", "sector": "Mesa de Ayuda",
         "como": "prueba de fuego", "cuando": "hace 3 días"},
        {"procedimiento": "Versionado y tag de release", "sector": "Desarrollo",
         "como": "simulacro de ausencia", "cuando": "hace 1 semana"},
        {"procedimiento": "Restauración de backup", "sector": "Infraestructura",
         "como": "prueba de fuego", "cuando": "hace 2 semanas"},
    ]

    return {
        "meta_trimestral": META_TRIMESTRAL,
        "logrado_total": logrado_total,
        "participacion_hoy_pct": min(100, round(40 + completadas_hoy * 15)),
        "niveles": niveles,
        "proxima_prueba_de_fuego": "jueves 30 de octubre",
        "logros_recientes": logros_recientes,
    }


@app.get("/api/meta-comun", response_model=MetaComun)
@limiter.limit(settings.rate_limit)
def api_meta_comun(request: Request):
    """Progreso del objetivo trimestral compartido. A propósito, el orden de
    la lista es siempre el mismo (no se reordena por quién va "ganando"):
    acá no hay primeros ni últimos, cada sector se mide contra su propio
    trimestre anterior, nunca contra los demás."""
    with db_session() as con:
        completadas_en_nivel_5 = con.execute(
            "SELECT COUNT(*) AS c FROM completadas"
        ).fetchone()["c"]
    sectores = []
    logrado_total = 0
    for sector in SECTORES_META:
        logrado = sector["logrado_base"] + (completadas_en_nivel_5 if sector.get("me") else 0)
        logrado_total += logrado
        sectores.append({
            "s": sector["s"],
            "logrado": logrado,
            "trimestre_anterior": sector["trimestre_anterior"],
            "me": sector.get("me"),
        })
    return {"meta_trimestral": META_TRIMESTRAL, "logrado_total": logrado_total, "sectores": sectores}


@app.get("/api/salud")
def salud():
    return {"ok": True, "hoy": date.today().isoformat()}
