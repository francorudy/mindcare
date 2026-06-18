import pathlib
import pickle
import numpy as np
import pandas as pd
from sklearn.tree import DecisionTreeClassifier
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import classification_report, confusion_matrix

BASE_DIR    = pathlib.Path(__file__).parent
XLSX_PATH   = BASE_DIR / "PHQ9_Student_Depression_Dataset_Updated.xlsx"
MODEL_PATH  = BASE_DIR / "modelo_arbol.pkl"


# ── Mapeo de niveles del dataset → niveles de MindCare 
# Dataset tiene 5 niveles, MindCare usa 3
MAPEO_NIVEL = {
    "Minimal":           "Bajo",      # PHQ-9: 0-4
    "Mild":              "Bajo",      # PHQ-9: 5-9
    "Moderate":          "Moderado",  # PHQ-9: 10-14
    "Moderately Severe": "Alto",      # PHQ-9: 15-19
    "Severe":            "Alto",      # PHQ-9: 20-27
}


# ── Mapeo de keywords NLP básico
PALABRAS_NEGATIVAS = {
    "mal", "triste", "deprimido", "solo", "soledad", "ansiedad", "ansioso",
    "miedo", "desesperado", "agotado", "cansado", "inútil", "fracasado",
    "llorar", "lloré", "lloro", "angustia", "angustiado", "sin esperanza",
    "hacerme daño", "morir", "muerte", "suicidio",
    # inglés (por si el texto libre es en inglés)
    "worthless", "hopeless", "exhausted", "failure", "burden",
    "self-harm", "dead", "ending everything", "lifeless",
}
PALABRAS_POSITIVAS = {
    "bien", "feliz", "contento", "alegre", "tranquilo", "motivado",
    "esperanza", "mejor", "positivo",
    # inglés
    "fine", "good", "confident", "focus", "enjoy", "normal", "well",
}


def _score_nlp(texto: str) -> tuple[int, int]:
    """Retorna (score_negativo, score_positivo) para un texto."""
    if not texto:
        return 0, 0
    t = str(texto).lower()
    neg = sum(1 for w in PALABRAS_NEGATIVAS if w in t)
    pos = sum(1 for w in PALABRAS_POSITIVAS if w in t)
    return neg, pos


#Cargar dataset real
def cargar_dataset_real() -> pd.DataFrame:
    if not XLSX_PATH.exists():
        raise FileNotFoundError(
            f"No se encontró el dataset en: {XLSX_PATH}"
        )

    df = pd.read_excel(XLSX_PATH)

    # Columnas de respuesta (preguntas 1-9)
    cols_preguntas = df.columns[1:10].tolist()

    # Combinar todas las respuestas de texto en un solo campo para NLP
    df["texto_combinado"] = df[cols_preguntas].apply(
        lambda row: " ".join(str(v) for v in row if pd.notna(v)), axis=1
    )

    # Calcular scores NLP
    df[["score_neg", "score_pos"]] = df["texto_combinado"].apply(
        lambda t: pd.Series(_score_nlp(t))
    )

    # Mapear nivel
    df["nivel_riesgo"] = df["Severity Level"].map(MAPEO_NIVEL)
    df = df.dropna(subset=["nivel_riesgo"])

    resultado = df[["PHQ-9 Score", "score_neg", "score_pos", "nivel_riesgo"]].copy()
    resultado.columns = ["puntaje_phq9", "score_negativo_nlp", "score_positivo_nlp", "nivel_riesgo"]
    return resultado


#Generar datos sintéticos 
def generar_sinteticos(n: int = 750, seed: int = 42) -> pd.DataFrame:
    rng = np.random.default_rng(seed)
    filas = []

    # Distribución por nivel
    dist = {"Bajo": int(n * 0.30), "Moderado": int(n * 0.30), "Alto": n - int(n * 0.30) - int(n * 0.30)}

    rangos = {
        "Bajo":      (0,  9),
        "Moderado":  (10, 14),
        "Alto":      (15, 27),
    }
    nlp_config = {
        # nivel: (neg_max, pos_max)
        "Bajo":     (1, 3),
        "Moderado": (3, 1),
        "Alto":     (5, 0),
    }

    for nivel, cantidad in dist.items():
        lo, hi = rangos[nivel]
        neg_max, pos_max = nlp_config[nivel]
        for _ in range(cantidad):
            puntaje = int(rng.integers(lo, hi + 1))
            neg = int(rng.integers(0, neg_max + 1))
            pos = int(rng.integers(0, pos_max + 1))
            filas.append([puntaje, neg, pos, nivel])

    return pd.DataFrame(filas, columns=[
        "puntaje_phq9", "score_negativo_nlp", "score_positivo_nlp", "nivel_riesgo"
    ])


#Entrenar modelo
def train():
    print("=" * 55)
    print("  MindCare — Entrenamiento Árbol de Decisión")
    print("=" * 55)

    # Cargar datos reales
    print("\nCargando dataset real...")
    df_real = cargar_dataset_real()
    print(f"   Registros reales: {len(df_real)}")
    print(f"   Distribución real:\n{df_real['nivel_riesgo'].value_counts().to_string()}")

    # Generar sintéticos
    print("\n🔧 Generando datos sintéticos...")
    df_sint = generar_sinteticos(n=750)
    print(f"   Registros sintéticos: {len(df_sint)}")

    # Combinar
    df = pd.concat([df_real, df_sint], ignore_index=True).sample(
        frac=1, random_state=42
    ).reset_index(drop=True)
    print(f"\nDataset combinado: {len(df)} registros")
    print(f"   Distribución final:\n{df['nivel_riesgo'].value_counts().to_string()}")

    # Features y target
    X = df[["puntaje_phq9", "score_negativo_nlp", "score_positivo_nlp"]]
    y = df["nivel_riesgo"]

    # Split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    # Entrenar árbol de decisión
    print("\nEntrenando árbol de decisión...")
    modelo = DecisionTreeClassifier(
        max_depth=6,
        min_samples_leaf=5,
        min_samples_split=10,
        class_weight="balanced",
        random_state=42,
    )
    modelo.fit(X_train, y_train)

    # Validación cruzada
    cv_scores = cross_val_score(modelo, X, y, cv=5, scoring="accuracy")
    print(f"\nValidación cruzada (5-fold):")
    print(f"   Accuracy promedio: {cv_scores.mean():.2%} ± {cv_scores.std():.2%}")

    # Reporte en test
    y_pred = modelo.predict(X_test)
    print(f"\neporte en conjunto de test:")
    print(classification_report(y_test, y_pred))

    print("Matriz de confusión:")
    print(confusion_matrix(y_test, y_pred, labels=["Bajo", "Moderado", "Alto"]))
    print(f"   Etiquetas: [Bajo, Moderado, Alto]")

    # Importancia de features
    print("\nImportancia de características:")
    for feat, imp in zip(X.columns, modelo.feature_importances_):
        print(f"   {feat}: {imp:.4f}")

    # Guardar modelo
    with open(MODEL_PATH, "wb") as f:
        pickle.dump(modelo, f)
    print(f"\nModelo guardado en: {MODEL_PATH}")
    print("\nEntrenamiento completado exitosamente")
    print("\nPróximo paso:")
    print("  Descomenta el bloque ML_TODO en app/services/procesamiento_service.py")


if __name__ == "__main__":
    train()