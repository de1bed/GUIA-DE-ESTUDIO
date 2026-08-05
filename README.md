# Ruta CDL — Guía de estudio

Portal bilingüe e interactivo para estudiar los documentos de conducción comercial incluidos en este repositorio.

## Abrir el portal

Abre `index.html` en un navegador moderno. No requiere instalación, compilación ni conexión a un servidor.

## Contenido

- Visor para los tres PDFs fuente, cada uno con su versión en español.
- Cuestionario traducido al español (`Cuestionario impreso - Espanol.pdf`), generado
  con `python build_spanish_pdf.py` a partir de las transcripciones de `bank/`.
- Explorador de las 26 hojas escaneadas del cuestionario.
- Capa de estudio en español junto al documento original.
- 256 espacios de respuesta y 253 claves; 254 preguntas con enunciado y
  opciones transcritos (las dos restantes se imprimen como `??` en el original).

> **Sobre la fuente:** el folleto original tiene 51 hojas, pero el PDF solo
> contiene las impares (1, 3, 5 … 51). Las 25 hojas pares nunca se escanearon,
> por eso la numeración de las preguntas salta. El portal rotula cada hoja con
> su folio real en lugar de renumerarlas.
- Exámenes personalizados, calificación, revisión e historial local.
- Tarjetas, escenarios, relaciones, secuencias, audio e infografías interactivas.
- Diseño adaptable para escritorio y dispositivos móviles.

## Verificación

La prueba funcional requiere Python, Selenium y Google Chrome:

```powershell
python test_portal.py
```

> Herramienta independiente de estudio. No es un sitio oficial ni está afiliado al California DMV o a MTS.
