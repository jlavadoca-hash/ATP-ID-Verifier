const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');

// 🔑 CONFIGURACIÓN (¡CAMBIA ESTOS VALORES!)
const GITHUB_PAGES_URL = 'http://localhost:8000/card.html'; // Usa localhost para pruebas
const CSV_FILE_PATH = path.join(__dirname, '../data/visitantes.csv');
const OUTPUT_DIR = path.join(__dirname, '../public/assets/qrs');

// Crear carpeta de salida si no existe
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function parseCsvFile(filePath) {
  const csvText = fs.readFileSync(filePath, 'utf8');
  const lines = csvText.split('\n').filter(line => line.trim() !== '');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim());
  const result = [];

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    
    const obj = {};
    let currentCol = 0;
    let currentValue = '';
    let inQuotes = false;

    // Parser manual para manejar comas dentro de comillas
    for (const char of lines[i]) {
      if (char === '"' && (currentValue === '' || lines[i][lines[i].indexOf(char)-1] !== '\\')) {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        obj[headers[currentCol]] = currentValue.trim().replace(/^"|"$/g, '');
        currentValue = '';
        currentCol++;
      } else {
        currentValue += char;
      }
    }
    
    if (currentValue && headers[currentCol]) {
      obj[headers[currentCol]] = currentValue.trim().replace(/^"|"$/g, '');
    }

    if (Object.keys(obj).length > 0) {
      result.push(obj);
    }
  }
  return result;
}

async function generateQrs() {
  try {
    console.log('📖 Leyendo datos de:', CSV_FILE_PATH);
    if (!fs.existsSync(CSV_FILE_PATH)) {
      throw new Error(`Archivo CSV no encontrado en: ${CSV_FILE_PATH}\n\n👉 ¡Exporta tu Google Sheet como CSV y guárdalo en data/visitantes.csv!`);
    }

    const participants = parseCsvFile(CSV_FILE_PATH);
    
    if (participants.length === 0) {
      throw new Error('No se encontraron participantes en el CSV. ¿El formato es correcto?');
    }

    console.log(`✅ Encontrados ${participants.length} participantes`);
    console.log('🧾 Primer participante de ejemplo:', participants[0]);

    for (const person of participants) {
      if (!person.ID) {
        console.warn(`⚠️ Saltando participante sin ID: ${JSON.stringify(person)}`);
        continue;
      }
      
      const qrUrl = `${GITHUB_PAGES_URL}?id=${encodeURIComponent(person.ID)}`;
      const qrPath = path.join(OUTPUT_DIR, `${person.ID}.png`);
      
      await QRCode.toFile(qrPath, qrUrl, {
        width: 500,
        margin: 2,
        color: {
          dark: '#000000ff',
          light: '#ffffffff'
        }
      });
      
      console.log(`✅ QR generado para ${person.ID}: ${qrUrl}`);
      console.log(`💾 Guardado en: ${qrPath}`);
    }
    
    console.log('\n🎉 ¡PROCESO COMPLETADO!');
    console.log(`📸 QRs generados: ${participants.length}`);
    console.log(`📁 Carpeta de QRs: ${OUTPUT_DIR}`);
    console.log(`\n📍 Para ver las tarjetas, inicia un servidor en la carpeta "public":`);
    console.log(`   python -m http.server 8000 -d public`);
    console.log(`\n🌐 Luego abre: http://localhost:8000/card.html?id=V0001`);
  } catch (err) {
    console.error('\n❌ ERROR FATAL:', err.message);
    if (err.code === 'ENOENT') {
      console.error('\n💡 SOLUCIÓN: Crea la carpeta "data" y exporta tu Google Sheet como CSV:');
      console.error('   1. En Google Sheet: Archivo > Descargar > Valores separados por comas (.csv)');
      console.error('   2. Guárdalo como: data/visitantes.csv');
    }
    process.exit(1);
  }
}

generateQrs();