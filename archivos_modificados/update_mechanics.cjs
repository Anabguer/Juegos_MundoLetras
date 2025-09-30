const fs = require('fs');

// Leer el archivo JSON
const levels = JSON.parse(fs.readFileSync('levels.json', 'utf8'));

// Mecánicas disponibles y sus pesos (para distribución)
const mechanics = [
    { name: 'fog', weight: 30 },           // 30% de las mecánicas
    { name: 'hiddenWords', weight: 24 },   // 24% de las mecánicas
    { name: 'dynamicTimer', weight: 20 },  // 20% de las mecánicas
    { name: 'wordTimer', weight: 16 },     // 16% de las mecánicas
    { name: 'none', weight: 10 }           // 10% extra de básicos intercalados
];

// Función para seleccionar una mecánica aleatoria (excluyendo la anterior)
function getRandomMechanic(previousMechanic, isBasicTurn) {
    // Si es turno de nivel básico, siempre retornar 'none'
    if (isBasicTurn) {
        return 'none';
    }
    
    // Crear pool de mecánicas sin la anterior
    const availableMechanics = mechanics.filter(m => m.name !== previousMechanic && m.name !== 'none');
    
    // Calcular peso total
    const totalWeight = availableMechanics.reduce((sum, m) => sum + m.weight, 0);
    
    // Selección aleatoria ponderada
    let random = Math.random() * totalWeight;
    for (const mechanic of availableMechanics) {
        random -= mechanic.weight;
        if (random <= 0) {
            return mechanic.name;
        }
    }
    
    return availableMechanics[0].name;
}

console.log('📊 Estado inicial:');
const initialStats = {
    none: levels.filter(l => l.mechanics.special === 'none').length,
    fog: levels.filter(l => l.mechanics.special === 'fog').length,
    hiddenWords: levels.filter(l => l.mechanics.special === 'hiddenWords').length,
    dynamicTimer: levels.filter(l => l.mechanics.special === 'dynamicTimer').length,
    wordTimer: levels.filter(l => l.mechanics.special === 'wordTimer').length,
};
console.log(initialStats);
console.log(`Total: ${levels.length} niveles\n`);

// Actualizar mecánicas con patrón intercalado (50/50)
// Empezando con nivel básico para principiantes
let previousMechanic = null;

for (let i = 0; i < levels.length; i++) {
    // Patrón: Básico - Mecánica - Básico - Mecánica...
    // Nivel 1 (índice 0) será básico para principiantes
    const isBasicTurn = i % 2 === 0; // Pares (0,2,4...) son básicos
    
    const newMechanic = getRandomMechanic(previousMechanic, isBasicTurn);
    levels[i].mechanics.special = newMechanic;
    
    // Solo actualizar previousMechanic si no es 'none'
    if (newMechanic !== 'none') {
        previousMechanic = newMechanic;
    }
}

console.log('✅ Mecánicas actualizadas con patrón intercalado\n');

// Verificar que no hay mecánicas consecutivas repetidas
let hasConsecutiveDuplicates = false;
for (let i = 1; i < levels.length; i++) {
    const current = levels[i].mechanics.special;
    const previous = levels[i - 1].mechanics.special;
    
    if (current !== 'none' && previous !== 'none' && current === previous) {
        console.warn(`⚠️ Mecánicas consecutivas repetidas en niveles ${i} y ${i + 1}: ${current}`);
        hasConsecutiveDuplicates = true;
    }
}

if (!hasConsecutiveDuplicates) {
    console.log('✅ No hay mecánicas consecutivas repetidas\n');
}

console.log('📊 Estado final:');
const finalStats = {
    none: levels.filter(l => l.mechanics.special === 'none').length,
    fog: levels.filter(l => l.mechanics.special === 'fog').length,
    hiddenWords: levels.filter(l => l.mechanics.special === 'hiddenWords').length,
    dynamicTimer: levels.filter(l => l.mechanics.special === 'dynamicTimer').length,
    wordTimer: levels.filter(l => l.mechanics.special === 'wordTimer').length,
};
console.log(finalStats);
console.log(`\n📈 Porcentajes:`);
console.log(`None: ${((finalStats.none / levels.length) * 100).toFixed(1)}%`);
console.log(`Fog: ${((finalStats.fog / levels.length) * 100).toFixed(1)}%`);
console.log(`Hidden Words: ${((finalStats.hiddenWords / levels.length) * 100).toFixed(1)}%`);
console.log(`Dynamic Timer: ${((finalStats.dynamicTimer / levels.length) * 100).toFixed(1)}%`);
console.log(`Word Timer: ${((finalStats.wordTimer / levels.length) * 100).toFixed(1)}%`);

// Crear backup del archivo original
fs.writeFileSync('levels_backup.json', JSON.stringify(JSON.parse(fs.readFileSync('levels.json', 'utf8')), null, 2));
console.log('\n💾 Backup creado: levels_backup.json');

// Guardar el archivo actualizado
fs.writeFileSync('levels.json', JSON.stringify(levels, null, 2));
console.log('💾 Archivo actualizado: levels.json');

console.log('\n✨ ¡Proceso completado!');
