let dataPisang = {};

fetch("knowledge_base.json")
  .then(res => res.json())
  .then(data => {
    dataPisang = data.data_diagnosa_pisang;
    tampilkanGejala();
  });

function tampilkanGejala() {
  const area = document.getElementById("daftar-gejala");
  area.innerHTML = "";
  dataPisang.gejala.forEach(g => {
    const div = document.createElement("div");
    div.className = "gejala";
    div.innerHTML = `
      <label>
        <input type="checkbox" id="${g.kode}" onchange="toggleCF('${g.kode}')">
        ${g.kode} - ${g.nama}
      </label>
      <input type="number" id="cf_${g.kode}" value="0.8" min="0" max="1" step="0.1" disabled>
    `;
    area.appendChild(div);
  });
}

function toggleCF(kode) {
  const cb = document.getElementById(kode);
  const cfInput = document.getElementById("cf_" + kode);
  cfInput.disabled = !cb.checked;
  if (cb.checked) cfInput.value = 0.8;
}

function diagnosa() {
  const gejalaTerpilih = [];
  dataPisang.gejala.forEach(g => {
    const cb = document.getElementById(g.kode);
    if (cb.checked) {
      const cfUser = parseFloat(document.getElementById("cf_" + g.kode).value);
      gejalaTerpilih.push({ kode: g.kode, cf_user: cfUser });
    }
  });

  if (gejalaTerpilih.length === 0) {
    alert("Pilih minimal satu gejala terlebih dahulu!");
    return;
  }

  const hasil = hitungCF(gejalaTerpilih);
  tampilkanHasil(hasil);
}

function hitungCF(gejalaUser) {
  const hasilPenyakit = {};
  dataPisang.aturan.forEach(r => {
    const gejalaMatch = r.gejala.filter(k => gejalaUser.find(g => g.kode === k));
    if (gejalaMatch.length === r.gejala.length) {
      const cfGejalaUser = Math.min(...gejalaMatch.map(k => gejalaUser.find(g => g.kode === k).cf_user));
      const cfGabungan = cfGejalaUser * r.cf_pakar;
      if (hasilPenyakit[r.kode_penyakit]) {
        hasilPenyakit[r.kode_penyakit] = hasilPenyakit[r.kode_penyakit] + cfGabungan * (1 - hasilPenyakit[r.kode_penyakit]);
      } else {
        hasilPenyakit[r.kode_penyakit] = cfGabungan;
      }
    }
  });
  return hasilPenyakit;
}

function tampilkanHasil(hasil) {
  const hasilDiv = document.getElementById("hasil");
  const isi = document.getElementById("isi-hasil");
  isi.innerHTML = "";

  if (Object.keys(hasil).length === 0) {
    isi.innerHTML = "<b>Tidak ditemukan penyakit berdasarkan gejala yang dipilih.</b>";
  } else {
    let hasilArray = Object.entries(hasil).sort((a,b)=>b[1]-a[1]);
    hasilArray.forEach(([kode, cf]) => {
      const p = dataPisang.penyakit.find(x => x.kode === kode);
      isi.innerHTML += `
        <h3>${p.nama}</h3>
        <p><b>Nilai CF:</b> ${(cf*100).toFixed(2)}%</p>
        <p><b>Solusi:</b> ${p.solusi}</p>
        <hr>
      `;
    });
  }

  hasilDiv.style.display = "block";
}
