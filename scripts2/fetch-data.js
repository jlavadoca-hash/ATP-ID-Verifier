
document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const participantId = urlParams.get('id');

  // ✅ Depuración inmediata
  console.log("🔍 ID recibido:", participantId);

  if (!participantId) {
    document.body.innerHTML = `
      <h1>❌ Falta el parámetro 'id' en la URL</h1>
      <p>Ejemplo correcto: <code>card.html?id=V0001</code></p>
      <p>Tu URL actual: <code>${window.location.href}</code></p>
    `;
    return;
  }

  // ✅ Asegura que el JSON se llame EXACTAMENTE como está en tu carpeta
  fetch('data/visitantes.json')  // ← ¡CAMBIA A 'visitantes.json' SOLO SI ES EL NOMBRE REAL!
    .then(response => {
      if (!response.ok) {
        throw new Error(`Archivo no encontrado: ${response.status} ${response.statusText}`);
      }
      return response.json();
    })
    .then(data => {
      console.log("📦 Datos cargados:", data);

      // Busca con trim y mayúsculas/minúsculas flexibles
      const person = data.find(p => 
        p && p.ID && 
        String(p.ID).trim().toLowerCase() === String(participantId).trim().toLowerCase()
      );

      if (!person) {
        document.body.innerHTML = `
          <h1>❌ Participante no encontrado</h1>
          <p>ID buscado: <code>"${participantId}"</code></p>
          <p>IDs disponibles: ${data.map(p => `"${p.ID}"`).join(', ')}</p>
        `;
        return;
      }

      // ✅ Rellena la tarjeta
      document.getElementById('participant-id').textContent = person.ID;
      document.getElementById('name').textContent = person.Nombre_Completo || '—';
      document.getElementById('dni').textContent = person.DNI || '—';
      document.getElementById('phone').textContent = person.Celular || '—';
      document.getElementById('address').textContent = person.Dirección || '—';

      const photoImg = document.getElementById('photo');
      const photoUrl = person.FotoURL ? String(person.FotoURL).trim() : '';
      if (photoUrl) {
        photoImg.src = photoUrl;
        photoImg.onerror = () => { photoImg.src = 'assets/images/placeholder.jpg'; };
      }
    })
    .catch(err => {
      console.error("💥 Error:", err);
      document.body.innerHTML = `<h1>⚠️ Error</h1><pre>${err.message}</pre>`;
    });
});





