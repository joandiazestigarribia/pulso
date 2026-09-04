# Pulso — Versus Musical

**Demo en producción:** [pulsoapp.ar](https://pulsoapp.ar/)

## Sobre el proyecto

Pulso es una app de descubrimiento musical basada en comparaciones 1v1 ("versus") entre canciones. Cada elección del usuario actualiza un ranking dinámico y, después de suficientes votos, genera automáticamente un Perfil Sonoro personalizado (energía, mood, ritmo) junto con un avatar único.

## Arquitectura

El usuario interactúa con Pulso desde el navegador. La app (Next.js) maneja tanto la interfaz como la lógica de negocio (ranking, versus, generación del Perfil Sonoro) y se apoya en una base de datos PostgreSQL para guardar la información. Para el catálogo de canciones se integra con Deezer.
