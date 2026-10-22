# Racha

Prototipo del Trabajo Práctico de Design Thinking (Sistemas de Información IV,
UNLu) — caso Defensoría del Pueblo de CABA. Una app estilo Duolingo para
sostener, día a día, la cultura de calidad que la certificación ISO 9001 por sí
sola no garantiza.

Stack real, no una maqueta: **React (Vite)** en el frontend y **Python
(FastAPI + SQLite)** en el backend, con la lógica de racha, XP y liga
corriendo de verdad en el servidor.

Todos los datos (tickets, procedimientos, nombres) son de ejemplo — no son
datos reales del organismo.

## Estructura

```
racha-app/
  backend/     FastAPI + SQLite (la API y toda la lógica de negocio)
  frontend/    React + Vite (la interfaz)
```

## Correrlo en tu computadora

Necesitás **Python 3.10+** y **Node 18+** instalados.

### 1. Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Queda escuchando en `http://127.0.0.1:8000`. Podés probarlo con
`curl http://127.0.0.1:8000/api/estado`.

### 2. Frontend

En otra terminal:

```bash
cd frontend
npm install
npm run dev
```

Abrí `http://127.0.0.1:5173`. En desarrollo, Vite redirige automáticamente
las llamadas `/api/...` al backend (está configurado en `vite.config.js`), así
que no hace falta tocar nada más.

## Deployarlo para que lo pueda usar cualquiera

Para que el grupo (o la profesora) lo abra desde un link, sin instalar nada,
hace falta subir el backend y el frontend a algún servicio gratuito. La forma
más simple:

### Backend → Render.com (gratis)

1. Subí la carpeta `racha-app` a un repositorio de GitHub.
2. En [render.com](https://render.com), creá un **Web Service** nuevo
   apuntando a ese repo, con:
   - **Root directory:** `backend`
   - **Build command:** `pip install -r requirements.txt`
   - **Start command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
3. Cuando termine el deploy te da una URL tipo
   `https://racha-backend.onrender.com`. Guardala.

(Railway.app funciona igual de bien y es otra opción gratuita equivalente.)

### Frontend → Vercel o Netlify (gratis)

1. En [vercel.com](https://vercel.com) (o Netlify), importá el mismo repo.
   - **Root directory:** `frontend`
   - **Build command:** `npm run build`
   - **Output directory:** `dist`
2. Antes de deployar, agregá una variable de entorno:
   - `VITE_API_URL` = la URL de Render del paso anterior (sin barra al
     final, ej. `https://racha-backend.onrender.com`)
3. Deployá. Te da un link tipo `https://racha-app.vercel.app` — ese es el
   que compartís.

Con eso cualquiera que abra el link ve la app funcionando de verdad: completa
lecciones, suma racha y XP, y lo ve reflejado en la liga — todo corriendo
contra el backend real, no datos simulados en el navegador.

### Nota sobre el plan gratuito de Render

El plan free de Render "duerme" el backend si no recibe tráfico por un rato;
la primera carga después de estar dormido tarda ~30 segundos en despertar.
Para la presentación del viernes, conviene abrir el link un par de minutos
antes para que ya esté despierto.

## Qué mecánica implementa el backend (no solo la pantalla)

- **Lección diaria:** una tarea sacada de trabajo real (OTRS, Redmine, Git,
  Ansible), de texto libre o de opción, según el caso.
- **Racha con gracia de 3 días:** no se corta el primer día que no se cumple,
  solo si pasan más de 3 días sin ninguna lección completada
  (`evaluar_racha` en `backend/main.py`).
- **XP acumulado** por lección, persistido en SQLite — no se pierde al
  recargar la página.
- **Procedimientos de 5 niveles**, donde el último ("a prueba de ausencias")
  queda marcado en los datos pero **nunca lo asigna la app automáticamente**:
  esa validación la hace una persona de otro sector en la prueba de fuego
  mensual, a propósito, para que no se pueda hacer trampa escribiendo
  cualquier cosa.
- **Liga semanal** entre sectores, ordenada por XP.
