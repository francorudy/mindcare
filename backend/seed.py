import sys
import os
sys.path.append(os.path.dirname(__file__))

from app.database.connection import SessionLocal
from app.models.rol_model          import Rol
from app.models.nivel_riesgo_model import NivelRiesgo
from app.models.tipo_accion_model  import TipoAccion


CAMPUS_COUNSELING_RESOURCES = (
    "Campus Monterrico: orientacionpsicopedagogicamo@upc.pe\n"
    "Campus San Isidro: orientacionpsicopedagogicasi@upc.pe\n"
    "Campus San Miguel: orientacionpsicopedagogicasm@upc.pe\n"
    "Campus Villa: orientacionpsicopedagogicavi@upc.pe"
)

EMERGENCY_PHONE_RESOURCE = "Central telefónica: 313-3333"


def seed():
    db = SessionLocal()
    try:
        # Roles
        if not db.query(Rol).first():
            db.add_all([
                Rol(id_rol=1, nombre_rol="estudiante",  descripcion="Usuario estudiante"),
                Rol(id_rol=2, nombre_rol="consejero",   descripcion="Consejero universitario"),
                Rol(id_rol=3, nombre_rol="admin",       descripcion="Administrador del sistema"),
            ])
            db.commit()
            print("Roles insertados")

        #  Niveles de riesgo
        if not db.query(NivelRiesgo).first():
            db.add_all([
                NivelRiesgo(nombre_nivel="Bajo",      descripcion="Bienestar en rango saludable",          color="#22c55e", orden=1),
                NivelRiesgo(nombre_nivel="Moderado",  descripcion="Síntomas que requieren seguimiento",    color="#f59e0b", orden=2),
                NivelRiesgo(nombre_nivel="Alto",      descripcion="Síntomas significativos, acción urgente",color="#f97316", orden=3),
                NivelRiesgo(nombre_nivel="Crítico",   descripcion="Intervención inmediata requerida",       color="#ef4444", orden=4),
            ])
            db.commit()
            print("Niveles de riesgo insertados")
        elif not db.query(NivelRiesgo).filter(NivelRiesgo.nombre_nivel == "Crítico").first():
            db.add(NivelRiesgo(
                nombre_nivel="Crítico",
                descripcion="Intervención inmediata requerida",
                color="#ef4444",
                orden=4,
            ))
            db.commit()
            print("Nivel Crítico insertado")

        # Tipos de acción
        if not db.query(TipoAccion).first():
            db.add_all([
                TipoAccion(
                    nombre_accion="Contactar consejería universitaria",
                    descripcion="Habla con un profesional. Nuestro equipo está disponible de lunes a viernes.",
                    recursos=CAMPUS_COUNSELING_RESOURCES,
                    orden=1, estado="A",
                ),
                TipoAccion(
                    nombre_accion="Línea de emergencia 24/7",
                    descripcion="Si estás en crisis o tienes pensamientos de hacerte daño, llama ahora.",
                    recursos=EMERGENCY_PHONE_RESOURCE,
                    orden=2, estado="A",
                ),
                TipoAccion(
                    nombre_accion="Recursos de autocuidado",
                    descripcion="Explora técnicas de mindfulness, respiración y ejercicios para manejar el estrés.",
                    recursos="https://mindfulness.universidad.edu",
                    orden=3, estado="A",
                ),
                TipoAccion(
                    nombre_accion="Establecer una rutina saludable",
                    descripcion="Dormir bien, comer balanceado y hacer ejercicio pueden mejorar tu estado de ánimo.",
                    recursos="Guía de hábitos saludables: https://bienestar.universidad.edu/rutina",
                    orden=4, estado="A",
                ),
                TipoAccion(
                    nombre_accion="Conecta con tu red de apoyo",
                    descripcion="Comparte cómo te sientes con amigos, familiares o personas de confianza.",
                    recursos="Grupos de apoyo estudiantil: https://bienestar.universidad.edu/grupos",
                    orden=5, estado="A",
                ),
                TipoAccion(
                    nombre_accion="Llevar un registro de tu estado de ánimo",
                    descripcion="Monitorear tus emociones diariamente te ayuda a identificar patrones.",
                    recursos="App de diario emocional disponible en la plataforma",
                    orden=6, estado="A",
                ),
            ])
            db.commit()
            print("Tipos de acción insertados")
        else:
            consejeria = db.query(TipoAccion).filter(
                TipoAccion.nombre_accion == "Contactar consejería universitaria"
            ).first()
            if consejeria:
                consejeria.recursos = CAMPUS_COUNSELING_RESOURCES

            emergencia = db.query(TipoAccion).filter(
                TipoAccion.nombre_accion == "Línea de emergencia 24/7"
            ).first()
            if emergencia:
                emergencia.recursos = EMERGENCY_PHONE_RESOURCE

            db.commit()
            print("Contactos de consejería actualizados")

        print("\nSeed completado exitosamente")

    except Exception as e:
        db.rollback()
        print(f"Error en seed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()