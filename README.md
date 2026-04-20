# Control de Pulsaciones e IMC

Aplicacion web hecha solo con HTML, CSS y JavaScript vanilla para registrar datos personales y calcular en tiempo real:

- P1 manual o pulsaciones al despertar
- PM o pulsaciones maximas
- zonas cardiovasculares por metodo de Karvonen
- IMC y su clasificacion
- datos complementarios de un test fisico

## Como funciona

1. Abre `app/index.html` en el navegador.
2. Completa nombre, edad, peso, altura y P1.
3. Los resultados se actualizan automaticamente mientras escribes.
4. El bloque de test fisico permite registrar lugar, distancia, pulsos y tiempo.
5. Si falta un dato o es invalido, la interfaz muestra mensajes pequenos y evita valores incoherentes como `NaN`.

## Estructura del proyecto

- `app/index.html`: estructura semantica de la interfaz.
- `app/css/styles.css`: estilos visuales, layout responsive y tablas.
- `app/js/app.js`: inicializacion, listeners y sincronizacion del estado.
- `app/js/calculations.js`: formulas de PM, zonas e IMC.
- `app/js/calculations.js`: formulas de PM, zonas e IMC, mas parseo del tiempo del test.
- `app/js/validators.js`: limpieza y validacion de entradas.
- `app/js/ui.js`: renderizado de resultados, mensajes y tablas.
- `app/js/data-model.js`: modelo de registro y payload serializable para futuro guardado/exportacion.

## Donde estan las formulas

Las formulas principales estan en `app/js/calculations.js`:

- `calculateMaxHeartRate(age)`: `220 - edad`
- `calculateHeartRateReserve(pm, p1, intensity)`: `((PM - P1) * intensidad) + P1`
- `calculateTrainingZones(pm, p1)`: arma A1-A5 con limites enteros
- `calculateBMI(weight, height)`: `peso / (altura * altura)`
- `classifyBMI(bmi)`: devuelve el rango textual correspondiente
- `parseTestTimeToSeconds(value)`: interpreta tiempos como `17'33"`, `17:33` o `17m 33s`

## Como conectarlo despues con Excel o CSV

La app ya queda preparada para persistencia futura:

- `buildRecordFromState(formState)` devuelve un registro completo listo para guardar.
- `getSerializableFormSnapshot(formState)` genera un objeto serializable del estado actual.
- `prepareExportPayload(formState)` deja junto el registro y el snapshot para exportacion.
- `createExportRow(record)` prepara una fila plana con datos personales, fisiologicos y del test.
- `getFuturePersistenceHooks()` marca el punto donde luego pueden conectarse acciones como guardar, listar, editar, eliminar o exportar.

Para agregar CSV o Excel despues, bastaria con:

1. crear un boton `Guardar registro`
2. tomar el objeto generado por `buildRecordFromState(...)`
3. acumular registros en memoria o en almacenamiento persistente
4. transformar el arreglo de registros a CSV o a una hoja XLSX
