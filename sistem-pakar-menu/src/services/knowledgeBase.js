const fs = require('fs');
const path = require('path');

const kbPath = path.join(__dirname, 'knowledgeBase.json');
let kb = {};

// Load knowledge base
try {
  const raw = fs.readFileSync(kbPath, 'utf8');
  kb = JSON.parse(raw);
  console.log(`✅ Knowledge base loaded successfully`);
} catch (err) {
  console.error('❌ Gagal memuat knowledgeBase.json:', err);
}

/**
 * API: 
 * - getDiseaseNutritionRules(diseaseId)
 * - getNutritionFoodRules(nutritionCode)
 * - getAllRules()
 */
module.exports = {
  // === Tahap 1: Disease → Nutritional Needs ===
  getDiseaseNutritionRules: async (diseaseId) => {
    if (!kb.disease_nutrition_rules) return [];

    const normalized = ('' + diseaseId).toLowerCase();
    let code = diseaseId;

    if (normalized === 'jantung' || normalized === 'p1') code = 'P1';
    else if (normalized === 'kolesterol' || normalized === 'p2') code = 'P2';
    else if (normalized === 'diabetes' || normalized === 'p3') code = 'P3';
    else if (normalized === 'asam_urat' || normalized === 'asam urat' || normalized === 'p4') code = 'P4';

    const rules = kb.disease_nutrition_rules.filter(r => r.if.includes(code));
    return rules.map(r => ({
      id: r.id,
      if: r.if,
      then: r.then,
      cf: r.cf,
      description: r.description,
    }));
  },

  // === Tahap 2: Nutritional Needs → Food ===
  getNutritionFoodRules: async (nutritionCode) => {
    if (!kb.nutrition_food_rules) return [];

    const rules = kb.nutrition_food_rules.filter(r => r.if.includes(nutritionCode));
    return rules.map(r => ({
      id: r.id,
      if: r.if,
      then: r.then,
      mb: parseFloat(r.mb || 0),
      md: parseFloat(r.md || 0),
      food_name: r.food_name,
      category: r.category,
      reasoning: r.reasoning,
    }));
  },

  // === Ambil Semua Rules (opsional untuk debug) ===
  getAllRules: async () => {
    return {
      disease_nutrition_rules: kb.disease_nutrition_rules || [],
      nutrition_food_rules: kb.nutrition_food_rules || [],
    };
  },
};
