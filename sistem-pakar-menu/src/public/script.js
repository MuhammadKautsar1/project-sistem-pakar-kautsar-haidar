let foods = [];
let userName = '';
let userDisease = '';

// 🔹 Load data makanan dari knowledge base (frontend hanya baca file JSON)
async function loadFoods() {
  try {
    const res = await fetch('/src/services/knowledgeBase.json');
    foods = await res.json();

    // Jika file JSON punya struktur nested seperti { nutrition_food_rules: [...] }
    if (!Array.isArray(foods) && foods.nutrition_food_rules) {
      foods = foods.nutrition_food_rules;
    }

    console.log(`✅ Data makanan dimuat: ${foods.length} item`);
  } catch (err) {
    console.error('❌ Gagal memuat data makanan:', err);
  }
}

// 🔹 Ganti tampilan antar langkah (Step)
function showStep(id) {
  document.querySelectorAll('section').forEach(s => s.classList.add('hidden'));
  document.getElementById(id).classList.remove('hidden');
}

// 🔹 STEP 1 → STEP 2
document.getElementById('btn-to-step2').addEventListener('click', async () => {
  userName = document.getElementById('nama').value.trim();
  userDisease = document.getElementById('penyakit').value;

  if (!userName) {
    alert('Nama tidak boleh kosong!');
    return;
  }

  await loadFoods();
  renderFoodTable();
  showStep('step2');
});

// 🔹 Navigasi antar halaman
document.getElementById('btn-back-step1').addEventListener('click', () => showStep('step1'));
document.getElementById('btn-back-step2').addEventListener('click', () => showStep('step2'));
document.getElementById('btn-new').addEventListener('click', () => window.location.reload());

// 🔹 Tampilkan tabel makanan dengan dropdown kondisi user
function renderFoodTable() {
  const tableWrap = document.getElementById('food-table-wrap');
  let html = `
    <table class="food-table">
      <tr><th>No</th><th>Nama Makanan</th><th>Nilai Kondisi (CF User)</th></tr>
  `;

  foods.forEach((f, i) => {
    html += `
      <tr>
        <td>${i + 1}</td>
        <td>${f.food_name}</td>
        <td>
          <select id="cond-${f.then}" data-food="${f.then}">
            <option value="0.2">0.2</option>
            <option value="0.4">0.4</option>
            <option value="0.6" selected>0.6</option>
            <option value="0.8">0.8</option>
            <option value="1.0">1.0</option>
          </select>
        </td>
      </tr>`;
  });

  html += '</table>';
  tableWrap.innerHTML = html;
}

// 🔹 STEP 2 → Kirim data ke backend
document.getElementById('btn-process').addEventListener('click', async () => {
  const selectedFoods = foods.map(f => ({
    foodId: f.then,
    preference: parseFloat(document.getElementById(`cond-${f.then}`).value)
  }));

  const payload = {
    disease: userDisease,
    foods: selectedFoods
  };

  try {
    const res = await fetch('/api/diagnose', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    renderResults(data);
  } catch (err) {
    alert('❌ Gagal memproses inferensi. Pastikan server berjalan.');
    console.error(err);
  }
});

// 🔹 STEP 3 → Tampilkan hasil rekomendasi makanan
function renderResults(result) {
  const wrap = document.getElementById('results-wrap');
  const info = document.getElementById('user-info');

  if (!result.success) {
    wrap.innerHTML = `<p class="error">Terjadi kesalahan: ${result.error}</p>`;
    info.textContent = '';
    showStep('step3');
    return;
  }

  info.innerHTML = `
    <b>Nama:</b> ${userName} <br>
    <b>Penyakit:</b> ${userDisease.toUpperCase()} <br>
    <b>Kebutuhan Nutrisi:</b> ${result.nutritionCode || 'Umum'}
  `;

  const categories = result.recommendations;
  let html = '';

  for (const [category, items] of Object.entries(categories)) {
    html += `<h3>${category}</h3>`;

    if (items.length === 0) {
      html += `<div class="card-result empty">Tidak ada rekomendasi.</div>`;
      continue;
    }

    html += '<div class="card-container">';
    items.forEach(f => {
      html += `
        <div class="card-result">
          <h4>${f.foodName}</h4>
          <p><b>CF:</b> ${f.cfPercentage}%</p>
          <p>${f.reasoning || 'Makanan ini direkomendasikan berdasarkan kebutuhan umum.'}</p>
        </div>
      `;
    });
    html += '</div>';
  }

  wrap.innerHTML = html;
  showStep('step3');
}
