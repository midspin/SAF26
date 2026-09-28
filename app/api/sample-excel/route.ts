import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

export async function GET() {
  try {
    const sampleRows = [
      {
        'SAF Code': 'Ac-1',
        'Inventory Category': 'Technical',
        'Sub Category': 'Cables',
        'Element': 'HDMI Cable 4K 10M',
        'Year of Purchase': '2023',
        'Brand | Project': 'Kramer',
        'Model': 'C-HM/HM/PRO-30',
        'Size/LWH': '10M',
        'Uom': 'Mtr',
        'Serial No': 'Na',
        'Qty': 25,
        'Location': 'Delhi Warehouse',
        'Condition': 'OK',
        'Throw Ratio': 'Na',
        'Remarks': 'High speed optical HDMI cable',
      },
      {
        'SAF Code': 'Ac-2',
        'Inventory Category': 'Technical',
        'Sub Category': 'Cables',
        'Element': '12G SDI Reel Cable',
        'Year of Purchase': '2024',
        'Brand | Project': 'Canare',
        'Model': 'L-5CFB',
        'Size/LWH': '25M',
        'Uom': 'Mtr',
        'Serial No': 'Na',
        'Qty': 40,
        'Location': 'Delhi Warehouse',
        'Condition': 'OK',
        'Throw Ratio': 'Na',
        'Remarks': 'Heavy duty broadcast SDI cable',
      },
      {
        'SAF Code': 'Pj-101',
        'Inventory Category': 'Technical',
        'Sub Category': 'Projection',
        'Element': '4K Laser Projector 10,000 Lm',
        'Year of Purchase': '2025',
        'Brand | Project': 'Epson',
        'Model': 'EB-PU2010W',
        'Size/LWH': '545 x 436 x 189 mm',
        'Uom': 'Nos',
        'Serial No': 'EP-994821',
        'Qty': 6,
        'Location': 'Goa Venue Central Warehouse',
        'Condition': 'OK',
        'Throw Ratio': '0.35:1',
        'Remarks': 'Includes UST lens ELPLX02S',
      },
      {
        'SAF Code': 'FLT-99', // FAULTY ITEM MARKED RED IN EXCEL
        'Inventory Category': 'Technical',
        'Sub Category': 'Projection',
        'Element': 'Defective Laser Projector (Red Flagged)',
        'Year of Purchase': '2022',
        'Brand | Project': 'Barco',
        'Model': 'UDX-4K32',
        'Size/LWH': '600 x 500 x 300 mm',
        'Uom': 'Nos',
        'Serial No': 'BAR-FLT-8812',
        'Qty': 2,
        'Location': 'Repair Bay Depot',
        'Condition': 'Faulty (Red Flagged)',
        'Throw Ratio': '1.5:1',
        'Remarks': 'Marked RED in sheet - Defective optical engine (Cannot be allocated)',
        '_isRed': true,
      },
      {
        'SAF Code': 'Ac-15',
        'Inventory Category': 'Technical',
        'Sub Category': 'Audio',
        'Element': 'Genelec Active Monitor Speaker',
        'Year of Purchase': '2024',
        'Brand | Project': 'Genelec',
        'Model': '8040B',
        'Size/LWH': '350 x 237 x 223 mm',
        'Uom': 'Nos',
        'Serial No': 'GEN-44102',
        'Qty': 12,
        'Location': 'Goa Venue Central Warehouse',
        'Condition': 'OK',
        'Throw Ratio': 'Na',
        'Remarks': 'Studio monitor with bracket',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Technical Inventory');

    const buf = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    return new Response(buf, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="Inventory TECH 2026.xlsx"',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
