from app.schemas.auth_schema         import UsuarioCreate, UsuarioLogin, UsuarioOut, TokenOut
from app.schemas.evaluacion_schema   import EvaluacionCreate, EvaluacionOut
from app.schemas.phq9_schema         import RespuestaPHQ9Item, PHQ9Submit, RespuestaPHQ9Out
from app.schemas.journal_schema      import TextoLibreCreate, TextoLibreOut
from app.schemas.resultado_schema    import ResultadoOut
from app.schemas.recomendacion_schema import AccionOut
from app.schemas.admin_schema        import (
    HistorialOut, EstudianteRiesgoOut, DashboardResumenOut,
    CaseDetailOut, SeguimientoUpdate,
)
from app.schemas.catalogo_schema     import NivelRiesgoOut, TipoAccionOut