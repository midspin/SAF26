/**
 * Inventory Categorizer Utility (JS/CJS)
 */

const TECHNICAL_SUB_CATEGORIES = [
  'Amp',
  'Camera',
  'Cables',
  'Display',
  'Headphone',
  'IT',
  'Media Player',
  'Mic',
  'Misc.',
  'Misc',
  'Mobile Device',
  'Mount',
  'PC',
  'Screen',
  'Speaker',
  'Sound',
  'Splitter',
  'Tab',
  'WiFi',
  'Appliance',
];

const TECH_SUB_SET = new Set(
  TECHNICAL_SUB_CATEGORIES.map((s) => s.toLowerCase().trim())
);

function isTechnicalSubCategory(subCategory) {
  if (!subCategory) return false;
  const norm = subCategory.toLowerCase().trim();
  
  if (TECH_SUB_SET.has(norm)) return true;
  
  for (const techSub of TECHNICAL_SUB_CATEGORIES) {
    const t = techSub.toLowerCase().trim();
    if (norm === t) return true;
    if (norm.startsWith(t + ' ') || norm.startsWith(t + '&') || norm.startsWith(t + '-') || norm.startsWith(t + '/')) {
      return true;
    }
  }
  return false;
}

function determineInventoryCategory(subCategory, existingCategory) {
  if (isTechnicalSubCategory(subCategory)) {
    return {
      inventoryCategory: 'Technical',
      inventoryUsageType: 'TECHNICAL',
    };
  }

  const category = existingCategory && existingCategory !== 'Technical' && existingCategory !== 'General' && existingCategory.trim() !== ''
    ? existingCategory.trim()
    : 'Production';

  return {
    inventoryCategory: category,
    inventoryUsageType: 'PRODUCTION',
  };
}

module.exports = {
  TECHNICAL_SUB_CATEGORIES,
  isTechnicalSubCategory,
  determineInventoryCategory,
};
