# 🔍 DEBUG: PROCESO DE SELECCIÓN DE LETRAS

## 📋 JERARQUÍA ACTUAL DE Z-INDEX

```
1. Fondo del grid: z-index: 1
2. Fondo de celdas seleccionadas: z-index: 5
3. Píldoras temporales/permanentes: z-index: 10
4. Letras de las celdas: z-index: 20
```

## 🎯 PROBLEMA ACTUAL

- ✅ **Píldora**: Se ve (z-index: 10)
- ❌ **Letras**: No se ven (z-index: 20, pero están por encima de la píldora)

## 🔄 PROCESO DE SELECCIÓN

### 1. **Usuario inicia selección**
```javascript
// En handleDrag()
const cell = document.querySelector(`#game-grid .grid-cell[data-index="${index}"]`);
cell.classList.add('is-selected');
```

### 2. **CSS aplicado a celda seleccionada**
```css
#game-grid .grid-cell.is-selected {
    background: white !important;        /* Fondo blanco */
    background-color: white !important;
    color: #000000 !important;          /* Letras negras */
    z-index: 5 !important;              /* Por debajo de píldora */
}
```

### 3. **Píldora temporal creada**
```javascript
// En createPill()
const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
rect.setAttribute("class", "fill-c0");  /* Color rosa */
rect.setAttribute("opacity", "1.0");    /* Completamente opaca */
```

### 4. **Píldora añadida al overlay**
```javascript
overlaySVG.appendChild(currentPill);
// overlaySVG tiene z-index: 10
```

## 🐛 DIAGNÓSTICO DEL PROBLEMA

### **¿Por qué no se ven las letras?**

1. **Z-index correcto**: Letras (20) > Píldora (10) ✅
2. **Color correcto**: Letras negras (#000000) ✅
3. **Fondo correcto**: Fondo blanco ✅

### **Posibles causas:**

1. **Problema de contexto de apilamiento**: El SVG puede estar creando un nuevo contexto
2. **Problema de posición**: Las letras pueden estar fuera del área visible
3. **Problema de CSS**: Alguna regla puede estar sobrescribiendo el color

## 🔧 SOLUCIONES A PROBAR

### **Opción 1: Aumentar z-index de letras**
```css
#game-grid .grid-cell.is-selected {
    z-index: 30 !important;  /* Por encima de píldora */
}
```

### **Opción 2: Reducir z-index de píldora**
```css
#game-grid .overlay {
    z-index: 5;  /* Por debajo de letras */
}
```

### **Opción 3: Verificar contexto de apilamiento**
```css
#game-grid {
    z-index: 1;
    position: relative;
}
```

## 📊 LOGS DE DEBUG ACTUALES

```
🎨 Píldora visible: SÍ
🎨 Píldora color: rect=fill-c0, line=stroke-c0
🎨 Píldora opacidad: rect=1.0, line=0.95
🔍 Z-INDEX DEBUG:
  - Overlay SVG: 10
  - Primera celda: 20
  - Primera celda classes: grid-cell is-selected
```

## 🎯 PRÓXIMOS PASOS

1. **Verificar** si las letras están realmente en el DOM
2. **Comprobar** si el color se está aplicando correctamente
3. **Probar** diferentes combinaciones de z-index
4. **Inspeccionar** el elemento en el navegador para ver el CSS aplicado

---

**Fecha**: $(date)
**Estado**: Píldora visible, letras no visibles
**Prioridad**: ALTA - Funcionalidad básica del juego
