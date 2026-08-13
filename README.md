# Ruta CDL — Guía de estudio

Portal bilingüe e interactivo para estudiar los documentos de conducción comercial incluidos en este repositorio.

## Abrir el portal

Abre `index.html` en un navegador moderno. No requiere instalación, compilación ni conexión a un servidor.

## Contenido

- Visor para los tres PDFs fuente, cada uno con su versión en español.
- Cuestionario completo `Mandatory Class B Practice Test.pdf` con sus 52 hojas consecutivas.
- Traducción bilingüe (`Mandatory Class B Practice Test - Espanol.pdf`), generada
  con `python build_spanish_pdf.py` a partir de las transcripciones de `bank-v2/`.
- Explorador de las 52 hojas escaneadas del cuestionario.
- Capa de estudio en español junto al documento original.
- 500 preguntas con enunciado, opciones y traducción, todas con respuesta.
  271 claves venían impresas en el folleto; las 229 restantes se completaron
  y el portal declara la procedencia de cada una al verificarla:
  - 65 copiadas de otra hoja que repite la misma pregunta con su clave impresa.
  - 164 deducidas de los manuales oficiales, citando página y frase de apoyo,
    y etiquetadas «RESPUESTA CON IA BASADA EN LOS MANUALES».
  El desglose completo está en `data/procedencia-de-claves.md`, incluida la
  lista de las 31 que conviene revisar por no tener una frase literal detrás.
- Exámenes personalizados, calificación, revisión e historial local.
- Tarjetas, escenarios, relaciones, secuencias, audio e infografías interactivas.
- Diseño adaptable para escritorio y dispositivos móviles.

## Regenerar las claves completadas

Las respuestas que el folleto no traía se declaran en `data/claves-ia.json`
(con su cita y su nivel de certeza) y se compilan a `data/claves-ia.js`:

```powershell
python build_ia_keys.py    # arma data/claves-ia.js y valida que no falte ninguna
python keys_report.py      # actualiza data/procedencia-de-claves.md
```

## Verificación

La prueba funcional requiere Python, Selenium y Google Chrome:

```powershell
python test_portal.py
```

> Herramienta independiente de estudio. No es un sitio oficial ni está afiliado al California DMV o a MTS.
