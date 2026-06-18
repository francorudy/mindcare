from pydantic import BaseModel

class UserCreate(BaseModel):
    nombre: str
    correo: str
    password: str
    rol: str