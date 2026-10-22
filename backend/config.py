"""
Configuración centralizada, vía variables de entorno (.env).

Nada de valores sensibles hardcodeados en el código: esto es lo mínimo que
se espera de un backend real, aunque este sea un prototipo con datos de
ejemplo. En producción, ALLOWED_ORIGINS se limita al dominio real del
frontend deployado — nunca "*".
"""
from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    entorno: str = "desarrollo"  # "desarrollo" | "produccion"
    allowed_origins: str = "http://127.0.0.1:5173,http://localhost:5173"
    db_path: str = str(Path(__file__).parent / "racha.db")
    rate_limit: str = "60/minute"

    @property
    def origins_list(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",") if o.strip()]

    @property
    def es_produccion(self) -> bool:
        return self.entorno == "produccion"


@lru_cache
def get_settings() -> Settings:
    return Settings()
