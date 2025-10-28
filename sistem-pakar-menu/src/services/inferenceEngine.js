const { getDiseaseNutritionRules, getNutritionFoodRules } = require('./knowledgeBase');

// 🔹 Fungsi kombinasi CF jika ada lebih dari satu aturan dengan hasil sama
function combineCF(cf1, cf2) {
  if (cf1 >= 0 && cf2 >= 0) return cf1 + cf2 * (1 - cf1);
  if (cf1 < 0 && cf2 < 0) return cf1 + cf2 * (1 + cf1);
  return (cf1 + cf2) / (1 - Math.min(Math.abs(cf1), Math.abs(cf2)));
}

// 🔹 Fungsi utama inference
async function diagnose(disease, foodsFromUser) {
  // 1️⃣ Ambil aturan penyakit → kebutuhan nutrisi
  const diseaseRules = await getDiseaseNutritionRules(disease);
  if (diseaseRules.length === 0) {
    return { success: false, error: `Penyakit '${disease}' tidak dikenali.` };
  }

  // 2️⃣ Tentukan kebutuhan nutrisi (contoh: 'umum' atau sesuai rule)
  const nutritionCode = diseaseRules[0].then || 'umum';

  // 3️⃣ Ambil aturan kebutuhan nutrisi → makanan
  const foodRules = await getNutritionFoodRules(nutritionCode);
  if (foodRules.length === 0) {
    return { success: false, error: `Tidak ada aturan makanan untuk kebutuhan nutrisi '${nutritionCode}'.` };
  }

  // 4️⃣ Hitung Certainty Factor (CF)
  const results = [];

  for (const rule of foodRules) {
    const userInput = foodsFromUser.find(f => f.foodId === rule.then);
    const userCond = userInput ? parseFloat(userInput.preference) : 0.6; // default netral 0.6

    const cfRule = (rule.mb || 0) - (rule.md || 0);
    const cfFinal = cfRule * userCond;

    // Gabungkan jika ada aturan paralel untuk makanan yang sama
    const existing = results.find(r => r.foodName === rule.food_name);
    if (existing) {
      existing.cfValue = combineCF(existing.cfValue, cfFinal);
      existing.cfPercentage = Math.round(existing.cfValue * 100);
    } else {
      results.push({
        foodName: rule.food_name,
        category: rule.category,
        cfValue: cfFinal,
        cfPercentage: Math.round(cfFinal * 100),
        reasoning: rule.reasoning || `Makanan ${rule.food_name} sesuai kebutuhan nutrisi ${nutritionCode}.`
      });
    }
  }

  // 5️⃣ Filter hasil dengan ambang batas CF
  const filtered = results.filter(r => r.cfValue > 0.3);

  // 6️⃣ Kelompokkan hasil berdasarkan kategori
  const grouped = {
    'Makanan Pokok': filtered.filter(f => f.category === 'Makanan Pokok'),
    'Lauk Pauk': filtered.filter(f => f.category === 'Lauk Pauk'),
    'Sayuran': filtered.filter(f => f.category === 'Sayuran'),
    'Buah': filtered.filter(f => f.category === 'Buah')
  };

  return {
    success: true,
    disease,
    nutritionCode,
    totalFoods: filtered.length,
    recommendations: grouped
  };
}

module.exports = { diagnose };
