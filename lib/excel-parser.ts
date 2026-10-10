import * as XLSX from 'xlsx';

import { determineInventoryCategory } from './inventory-categorizer';

export interface ProcessedInventoryRow {
  rowNum: number;
  safCode: string;
  inventoryCategory: string;
  subCategory: string;
  element: string;
  yearOfPurchase: string;
  brandProject: string;
  model: string;
  sizeLwh: string;
  uom: string;
  serialNo: string;
  totalQuantity: number;
  location: string;
  condition: string;
  throwRatio: string;
  remarks: string;
  isFaulty: boolean;
}

function normalizeKey(str: any): string {
  if (str === null || str === undefined) return '';
  return str.toString().toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function parseSmartInventoryExcel(worksheet: XLSX.WorkSheet): { rows: ProcessedInventoryRow[]; faultyCount: number } {
  // Convert worksheet to 2D array of raw values to detect header row
  const matrix: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
  
  if (!matrix || matrix.length === 0) {
    return { rows: [], faultyCount: 0 };
  }

  // Keywords that indicate a column header row
  const headerKeywords = [
    'saf', 'code', 'category', 'element', 'description', 'item', 'brand', 'make',
    'model', 'year', 'purchase', 'serial', 'qty', 'quantity', 'location', 'store',
    'condition', 'remarks', 'size', 'lwh', 'uom', 'unit'
  ];

  // 1. Auto-detect Header Row Index in top 15 rows
  let bestHeaderRowIndex = 0;
  let maxKeywordScore = -1;

  for (let r = 0; r < Math.min(matrix.length, 15); r++) {
    const rowValues = matrix[r] || [];
    let score = 0;
    for (const cell of rowValues) {
      const norm = normalizeKey(cell);
      if (norm.length > 0 && headerKeywords.some(kw => norm.includes(kw))) {
        score++;
      }
    }
    if (score > maxKeywordScore) {
      maxKeywordScore = score;
      bestHeaderRowIndex = r;
    }
  }

  // Extract Header Row cells
  const headerRowCells = matrix[bestHeaderRowIndex] || [];
  
  // Build Index map for known target fields based on headers
  const fieldIndexMap: Record<string, number> = {};

  headerRowCells.forEach((cellVal, colIdx) => {
    const norm = normalizeKey(cellVal);
    if (!norm) return;

    if (!fieldIndexMap['safCode'] && (norm.includes('saf') || norm === 'code' || norm === 'safcode' || norm === 'itemcode' || norm === 'id')) {
      fieldIndexMap['safCode'] = colIdx;
    } else if (!fieldIndexMap['inventoryCategory'] && (norm.includes('invcategory') || norm.includes('inventorycategory') || norm === 'category' || norm === 'cat' || norm === 'maincategory' || norm === 'type')) {
      fieldIndexMap['inventoryCategory'] = colIdx;
    } else if (!fieldIndexMap['subCategory'] && (norm.includes('subcategory') || norm.includes('subcat') || norm === 'sub')) {
      fieldIndexMap['subCategory'] = colIdx;
    } else if (!fieldIndexMap['element'] && (norm.includes('element') || norm.includes('description') || norm.includes('itemname') || norm.includes('equipment') || norm === 'item' || norm === 'particulars' || norm === 'name')) {
      fieldIndexMap['element'] = colIdx;
    } else if (!fieldIndexMap['yearOfPurchase'] && (norm.includes('year') || norm.includes('purchaseyear') || norm.includes('yop') || norm.includes('purchasedate'))) {
      fieldIndexMap['yearOfPurchase'] = colIdx;
    } else if (!fieldIndexMap['brandProject'] && (norm.includes('brand') || norm.includes('make') || norm.includes('project') || norm.includes('manufacturer'))) {
      fieldIndexMap['brandProject'] = colIdx;
    } else if (!fieldIndexMap['model'] && (norm.includes('model') || norm.includes('spec') || norm.includes('modelfpec'))) {
      fieldIndexMap['model'] = colIdx;
    } else if (!fieldIndexMap['sizeLwh'] && (norm.includes('size') || norm.includes('lwh') || norm.includes('dimension') || norm.includes('dimensions'))) {
      fieldIndexMap['sizeLwh'] = colIdx;
    } else if (!fieldIndexMap['uom'] && (norm.includes('uom') || norm === 'unit' || norm === 'units' || norm === 'unitofmeasure')) {
      fieldIndexMap['uom'] = colIdx;
    } else if (!fieldIndexMap['serialNo'] && (norm.includes('serial') || norm.includes('srno') || norm.includes('slno') || norm === 'sn' || norm === 'snno')) {
      fieldIndexMap['serialNo'] = colIdx;
    } else if (!fieldIndexMap['totalQuantity'] && (norm.includes('qty') || norm.includes('quantity') || norm === 'count' || norm === 'nos' || norm === 'totalqty')) {
      fieldIndexMap['totalQuantity'] = colIdx;
    } else if (!fieldIndexMap['location'] && (norm.includes('location') || norm.includes('store') || norm.includes('warehouse') || norm.includes('storage') || norm === 'loc')) {
      fieldIndexMap['location'] = colIdx;
    } else if (!fieldIndexMap['condition'] && (norm.includes('condition') || norm.includes('status') || norm.includes('health') || norm.includes('state'))) {
      fieldIndexMap['condition'] = colIdx;
    } else if (!fieldIndexMap['throwRatio'] && (norm.includes('throw') || norm.includes('ratio') || norm.includes('lensratio'))) {
      fieldIndexMap['throwRatio'] = colIdx;
    } else if (!fieldIndexMap['remarks'] && (norm.includes('remark') || norm.includes('note') || norm.includes('comments') || norm.includes('comment'))) {
      fieldIndexMap['remarks'] = colIdx;
    }
  });

  // Fallback row object parsing via XLSX.utils.sheet_to_json if matrix header mapping had missing fields
  const rawObjects: any[] = XLSX.utils.sheet_to_json(worksheet, { range: bestHeaderRowIndex, defval: '' });

  let faultyCount = 0;
  const processedRows: ProcessedInventoryRow[] = [];

  // Iterate rows below header
  for (let i = bestHeaderRowIndex + 1; i < matrix.length; i++) {
    const row = matrix[i];
    if (!row || row.every((c: any) => c === null || c === undefined || c === '')) {
      continue; // Skip blank rows
    }

    const objIndex = i - (bestHeaderRowIndex + 1);
    const rawObj = rawObjects[objIndex] || {};

    const getVal = (fieldKey: string, fallbackKeys: string[], defaultVal: string = 'Na'): string => {
      // 1. Try matrix column index
      const colIdx = fieldIndexMap[fieldKey];
      if (colIdx !== undefined && row[colIdx] !== undefined && row[colIdx] !== null && row[colIdx].toString().trim() !== '') {
        return row[colIdx].toString().trim();
      }
      // 2. Try raw object key match
      for (const key of Object.keys(rawObj)) {
        const normK = normalizeKey(key);
        if (fallbackKeys.some(fk => normK.includes(fk))) {
          const val = rawObj[key];
          if (val !== undefined && val !== null && val.toString().trim() !== '') {
            return val.toString().trim();
          }
        }
      }
      return defaultVal;
    };

    const elementVal = getVal('element', ['element', 'description', 'item', 'equipment', 'particulars', 'name'], '');
    const safCodeVal = getVal('safCode', ['saf', 'code'], '');
    
    // Skip if row has no element description and no SAF code
    if (!elementVal && !safCodeVal) {
      continue;
    }

    const rowNum = i + 1; // 1-indexed row number in Excel
    const rawCategory = getVal('inventoryCategory', ['category', 'cat', 'type'], '');
    const subCategory = getVal('subCategory', ['subcategory', 'subcat', 'sub'], 'General');
    const { inventoryCategory: category } = determineInventoryCategory(subCategory, rawCategory);
    const yearOfPurchase = getVal('yearOfPurchase', ['year', 'yop', 'purchase'], 'Na');
    const brandProject = getVal('brandProject', ['brand', 'make', 'project', 'manufacturer'], 'Na');
    const model = getVal('model', ['model', 'spec'], 'Na');
    const sizeLwh = getVal('sizeLwh', ['size', 'lwh', 'dimension'], 'Na');
    const uom = getVal('uom', ['uom', 'unit'], 'Nos');
    const serialNo = getVal('serialNo', ['serial', 'srno', 'slno', 'sn'], 'Na');
    const location = getVal('location', ['location', 'store', 'warehouse'], 'Central Warehouse');
    const condition = getVal('condition', ['condition', 'status'], 'OK');
    const throwRatio = getVal('throwRatio', ['throw', 'ratio'], 'Na');
    const remarks = getVal('remarks', ['remark', 'note', 'comment'], '');

    const qtyStr = getVal('totalQuantity', ['qty', 'quantity', 'count', 'nos'], '1');
    const parsedQty = parseInt(qtyStr.replace(/[^0-9]/g, '')) || 1;

    // Red Cell formatting or Red/Faulty condition detection
    let isRedCell = false;
    if (fieldIndexMap['condition'] !== undefined || fieldIndexMap['element'] !== undefined) {
      const cellRef = XLSX.utils.encode_cell({ r: i, c: fieldIndexMap['element'] ?? 0 });
      const cell = worksheet[cellRef];
      if (cell && cell.s) {
        const fill = cell.s.fill?.fgColor?.rgb || cell.s.fgColor?.rgb || cell.s.fill?.bgColor?.rgb;
        if (fill && /ff0000|e53e3e|dc2626|f87171|rose|red/i.test(fill)) {
          isRedCell = true;
        }
      }
    }

    const isRedCondition = /red|faulty|damaged|broken|defect|not working/i.test(condition) || /red|faulty|damaged|broken/i.test(remarks);
    const isFaulty = isRedCell || isRedCondition || rawObj['_isRed'] === true || rawObj['_cellColor'] === 'RED';

    if (isFaulty) faultyCount++;

    processedRows.push({
      rowNum,
      safCode: safCodeVal || `SAF-${rowNum}`,
      inventoryCategory: category,
      subCategory,
      element: elementVal || 'Unnamed Element',
      yearOfPurchase,
      brandProject,
      model,
      sizeLwh,
      uom,
      serialNo,
      totalQuantity: parsedQty,
      location,
      condition: isFaulty ? 'Faulty (Red Flagged)' : condition,
      throwRatio,
      remarks,
      isFaulty,
    });
  }

  return { rows: processedRows, faultyCount };
}
