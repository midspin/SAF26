/**
 * Inventory Categorizer Utility
 * 
 * Rules:
 * There is only ONE unified Inventory.
 * Technical category is separated for items whose SubCategory is one of the 19 Technical SubCategories:
 * Amp, Camera, Cables, Display, Headphone, IT, Media Player, Mic, Misc., Mobile Device, Mount, PC, Screen, Speaker, Sound, Splitter, Tab, WiFi, Appliance.
 * 
 * All other SubCategories belong to the Production category.
 */

export const TECHNICAL_SUB_CATEGORIES = [
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
] as const;

const TECH_SUB_SET = new Set(
  TECHNICAL_SUB_CATEGORIES.map((s) => s.toLowerCase().trim())
);

export function isTechnicalSubCategory(subCategory: string | null | undefined): boolean {
  if (!subCategory) return false;
  const norm = subCategory.toLowerCase().trim();
  
  // Exact match
  if (TECH_SUB_SET.has(norm)) return true;
  
  // Check prefix or partial matches like "Cables & Accessories", "Display Equipment", "Misc. Items"
  for (const techSub of TECHNICAL_SUB_CATEGORIES) {
    const t = techSub.toLowerCase().trim();
    if (norm === t) return true;
    if (norm.startsWith(t + ' ') || norm.startsWith(t + '&') || norm.startsWith(t + '-') || norm.startsWith(t + '/')) {
      return true;
    }
  }
  return false;
}

export function determineInventoryCategory(
  subCategory: string | null | undefined,
  existingCategory?: string | null
): {
  inventoryCategory: string;
  inventoryUsageType: 'TECHNICAL' | 'PRODUCTION';
} {
  if (isTechnicalSubCategory(subCategory)) {
    return {
      inventoryCategory: 'Technical',
      inventoryUsageType: 'TECHNICAL',
    };
  }

  // Any other subcategory apart from the 19 Technical subcategories falls into Production
  const category = existingCategory && existingCategory !== 'Technical' && existingCategory !== 'General' && existingCategory.trim() !== ''
    ? existingCategory.trim()
    : 'Production';

  return {
    inventoryCategory: category,
    inventoryUsageType: 'PRODUCTION',
  };
}
