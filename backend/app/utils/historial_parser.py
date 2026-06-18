import re
from typing import Tuple

SEGUIMIENTO_PATTERN = re.compile(
    r"^\[SEGUIMIENTO\|(\d+)\|([^\]]+)\]\s*(.*)$",
    re.DOTALL,
)


def parse_historial_observacion(observacion: str | None) -> Tuple[bool, str | None, str]:
    if not observacion:
        return False, None, ""

    match = SEGUIMIENTO_PATTERN.match(observacion.strip())
    if match:
        return True, match.group(2).strip(), match.group(3).strip()

    return False, None, observacion.strip()


def format_seguimiento_observacion(id_consejero: int, nombre_consejero: str, observacion: str) -> str:
    return f"[SEGUIMIENTO|{id_consejero}|{nombre_consejero}] {observacion.strip()}"
