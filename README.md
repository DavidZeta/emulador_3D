# Mini Cartucho Game Boy NFC

Base web mobile-first para el repositorio `DavidZeta/emulador_3D`. El sitio carga juegos desde un catalogo `games.json` usando EmulatorJS y muestra controles tactiles para jugar desde smartphone.

## Estructura

```text
.
├── index.html
├── style.css
├── app.js
├── games.json
└── roms/
    └── pokemon-amarillo.gbc
```

> No se incluye una ROM por defecto. Usa solo ROMs propias, homebrew o archivos para los que tengas permiso.

## Como usarlo

1. Crea la carpeta `roms` en la raiz del repositorio si no existe.
2. Copia tu ROM de Game Boy o Game Boy Color dentro de esa carpeta.
3. Renombra el archivo segun la ruta definida en `games.json`.
4. Sube `index.html`, `style.css`, `app.js`, `games.json` y tus ROMs a la rama principal.

Si tu juego es de Game Boy Color, puedes usar extension `.gbc`. Para Game Boy clasico, usa `.gb`. En ambos casos el core de EmulatorJS sigue siendo `"gb"`.

## Cambiar titulo y ROM

En `games.json`, ajusta o agrega juegos:

```json
{
  "default": "pokemon-amarillo",
  "games": {
    "pokemon-amarillo": {
      "title": "Pokemon Amarillo",
      "rom": "roms/pokemon-amarillo.gbc",
      "core": "gb",
      "color": "#f7d84a"
    }
  }
}
```

- `title`: nombre visible del juego y titulo de la pestana.
- `rom`: ruta del archivo ROM.
- `core`: usa `"gb"` para Game Boy y Game Boy Color.
- `color`: color principal del emulador.

## Links para NFC

Cada chip NFC puede abrir un juego concreto usando el parametro `game`:

```text
https://DavidZeta.github.io/emulador_3D/?game=pokemon-amarillo
```

Para agregar otro juego:

1. Copia la ROM a `roms/mi-juego.gb`.
2. Agrega una entrada en `games.json`:

```json
"mi-juego": {
  "title": "Mi Juego",
  "rom": "roms/mi-juego.gb",
  "core": "gb",
  "color": "#8fbf45"
}
```

3. Graba este link en el NFC:

```text
https://DavidZeta.github.io/emulador_3D/?game=mi-juego
```

## GitHub Pages

1. Entra al repositorio `DavidZeta/emulador_3D` en GitHub.
2. Ve a `Settings` > `Pages`.
3. En `Build and deployment`, selecciona `Deploy from a branch`.
4. En `Branch`, elige `main` y carpeta `/root`.
5. Guarda los cambios.

Cuando GitHub termine el despliegue, la pagina quedara disponible en:

```text
https://DavidZeta.github.io/emulador_3D/
```

## Audio en moviles

iOS y Android bloquean el audio hasta que el usuario toca la pantalla. Por eso la interfaz incluye el boton `Activar sonido`; tambien se intenta desbloquear el audio con el primer toque en los controles.

## Controles

Los controles tactiles envian eventos de teclado compatibles con la configuracion comun de EmulatorJS:

- D-Pad: flechas del teclado.
- B: `Z`.
- A: `X`.
- Select: `Shift`.
- Start: `Enter`.

Puedes cambiar esos mapeos en `app.js`, dentro de `keyMap` y los atributos `data-key` de `index.html`.
