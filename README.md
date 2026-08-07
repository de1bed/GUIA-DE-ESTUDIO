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
- 500 preguntas con enunciado, opciones y traducción; 271 claves disponibles.
- Exámenes personalizados, calificación, revisión e historial local.
- Tarjetas, escenarios, relaciones, secuencias, audio e infografías interactivas.
- Diseño adaptable para escritorio y dispositivos móviles.

## Verificación

La prueba funcional requiere Python, Selenium y Google Chrome:

```powershell
python test_portal.py
```

> Herramienta independiente de estudio. No es un sitio oficial ni está afiliado al California DMV o a MTS.
