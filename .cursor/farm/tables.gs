// ==============================
// TABLES.GS - Farm Management Sheet Setup
// Run setupAllTables() to create all required sheets
// ==============================

/**
 * MAIN FUNCTION - Run this to create all sheets
 * Go to: Extensions > Apps Script > Select "setupAllTables" > Run
 */
function setupAllTables() {
  const ss = SpreadsheetApp.getActive();
  const ui = SpreadsheetApp.getUi();
  
  const results = [];
  
  // Create each sheet
  for (const [sheetName, config] of Object.entries(FARM_TABLE_DEFINITIONS)) {
    const result = createOrUpdateSheet(ss, sheetName, config);
    results.push(result);
  }
  
  // Show results
  let message = "🌱 RESULTADO DE CREACIÓN DE HOJAS\n\n";
  let created = 0;
  let updated = 0;
  let existing = 0;
  
  results.forEach(r => {
    if (r.created) {
      message += `✅ ${r.name} - CREADA\n`;
      created++;
    } else if (r.updated) {
      message += `🔧 ${r.name} - ACTUALIZADA (columnas agregadas)\n`;
      updated++;
    } else {
      message += `⏭️ ${r.name} - Ya existía (sin cambios)\n`;
      existing++;
    }
  });
  
  message += `\n─────────────────────────\n`;
  message += `Total: ${results.length} hojas\n`;
  message += `Creadas: ${created}\n`;
  message += `Actualizadas: ${updated}\n`;
  message += `Sin cambios: ${existing}`;
  
  ui.alert("Setup Completo", message, ui.ButtonSet.OK);
  
  // Ensure Clases_Cultivo has default data
  ensureClasesCultivoData();
  
  // Populate default activities with proper Clase_Cultivo IDs
  populateDefaultActivities();
  
  return results;
}

/**
 * Creates a single sheet or updates its headers if it exists
 */
function createOrUpdateSheet(ss, sheetName, config) {
  let sheet = ss.getSheetByName(sheetName);
  let created = false;
  let updated = false;
  
  if (!sheet) {
    // Create new sheet
    sheet = ss.insertSheet(sheetName);
    created = true;
    
    // Set headers
    if (config.headers && config.headers.length > 0) {
      const headerRange = sheet.getRange(1, 1, 1, config.headers.length);
      headerRange.setValues([config.headers]);
      headerRange.setFontWeight("bold");
      headerRange.setBackground("#2d5016");
      headerRange.setFontColor("#ffffff");
    }
    
    // Add default data if specified
    if (config.defaultData && config.defaultData.length > 0) {
      sheet.getRange(2, 1, config.defaultData.length, config.defaultData[0].length)
           .setValues(config.defaultData);
    }
    
    // Freeze header row
    sheet.setFrozenRows(1);
    
    // Set column widths
    if (config.columnWidths) {
      for (const [col, width] of Object.entries(config.columnWidths)) {
        sheet.setColumnWidth(Number(col), width);
      }
    }
    
  } else {
    // Sheet exists - check for missing headers
    const lastCol = Math.max(sheet.getLastColumn(), 1);
    const existingHeaders = sheet.getRange(1, 1, 1, lastCol).getValues()[0]
                                 .map(h => String(h || "").trim());
    
    const missingHeaders = [];
    config.headers.forEach(h => {
      if (existingHeaders.indexOf(h) === -1) {
        missingHeaders.push(h);
      }
    });
    
    if (missingHeaders.length > 0) {
      // Add missing headers at the end
      const startCol = sheet.getLastColumn() + 1;
      missingHeaders.forEach((header, i) => {
        const cell = sheet.getRange(1, startCol + i);
        cell.setValue(header);
        cell.setFontWeight("bold");
        cell.setBackground("#2d5016");
        cell.setFontColor("#ffffff");
      });
      updated = true;
    }
  }
  
  return { name: sheetName, created, updated };
}

// ==============================
// TABLE DEFINITIONS
// All sheets and their column structures for Farm Management
// ==============================

var FARM_TABLE_DEFINITIONS = {
  
  // ─────────────────────────────────────────
  // CONFIGURACION - System settings
  // ─────────────────────────────────────────
  "Configuracion": {
    headers: ["Variable", "Valor", "Descripción"],
    defaultData: [
      ["TASA_CAMBIO", "4200", "Tasa de cambio COP por 1 USD"],
      ["SMMLV", "1300000", "Salario mínimo mensual legal vigente"],
      ["JORNAL_DIA", "65000", "Valor jornal por día de trabajo"],
      ["HORAS_JORNAL", "8", "Horas de trabajo por jornal"]
    ],
    columnWidths: { 1: 220, 2: 120, 3: 350 }
  },
  
  // ─────────────────────────────────────────
  // CLASES_CULTIVO - Crop classes catalog
  // ─────────────────────────────────────────
  "Clases_Cultivo": {
    headers: ["ID", "Nombre", "Fecha_Creacion", "Descripcion"],
    defaultData: [
      [generateId(), "HORTENSIA", new Date(), "Hortensia - Hydrangea"],
      [generateId(), "ROSA", new Date(), "Rosa - Rose"],
      [generateId(), "CLAVEL", new Date(), "Clavel - Carnation"]
    ],
    columnWidths: { 1: 280, 2: 180, 3: 150, 4: 300 }
  },
  
  // ─────────────────────────────────────────
  // USUARIOS - User authentication
  // ─────────────────────────────────────────
  "Usuarios": {
    headers: ["ID", "Nombre", "Clave", "Role", "Vereda", "Telefono"],
    defaultData: [
      [generateId(), "admin", "admin", "Administrador", "", ""]
    ],
    columnWidths: { 1: 280, 2: 150, 3: 120, 4: 120, 5: 150, 6: 120 }
  },
  
  // ─────────────────────────────────────────
  // UBICACIONES - Crop locations
  // ─────────────────────────────────────────
  "Ubicaciones": {
    headers: ["ID", "ID_Cultivo", "Nombre_Cultivo", "Vereda", "Municipio", "Área_m2", "Observaciones"],
    defaultData: [],
    columnWidths: { 1: 280, 2: 120, 3: 200, 4: 150, 5: 150, 6: 100, 7: 250 }
  },
  
  // ─────────────────────────────────────────
  // VARIEDADES - Crop varieties
  // ─────────────────────────────────────────
  "Variedades": {
    headers: ["ID", "Nombre", "Tipo_Cultivo", "ID_Ubicacion", "Ciclo_en_Semanas", "Semana_Inicio_Corte", "Rendimiento_Esperado_por_Planta", "Unidad_Rendimiento", "Tiene_Ciclos_Produccion", "Observaciones"],
    defaultData: [],
    columnWidths: { 1: 280, 2: 180, 3: 150, 4: 280, 5: 140, 6: 160, 7: 200, 8: 150, 9: 180, 10: 250 }
  },
  
  // ─────────────────────────────────────────
  // ACTIVIDADES - Activities catalog
  // ─────────────────────────────────────────
  "Actividades": {
    headers: ["ID", "ID_Clase_Cultivo", "ID_Variedad", "Nombre_Actividad", "Semana_Actividad", "Categoria", "Tiempo_Por_Planta_Seg", "Requiere_Insumos", "Insumos_JSON", "Descripcion"],
    defaultData: [], // Will be populated with proper IDs after Clases_Cultivo is created
    columnWidths: { 1: 280, 2: 280, 3: 280, 4: 180, 5: 120, 6: 150, 7: 160, 8: 120, 9: 200, 10: 250 }
  },
  
  // ─────────────────────────────────────────
  // CICLO_PRODUCCION - Production cycle templates
  // ─────────────────────────────────────────
  "Ciclo_Produccion": {
    headers: ["ID", "ID_Variedad", "Nombre_Ciclo", "Nro_Semana", "Porcentaje_Produccion", "Descripcion", "Actividades_Semana"],
    defaultData: [],
    columnWidths: { 1: 280, 2: 280, 3: 180, 4: 100, 5: 160, 6: 250, 7: 200 }
  },
  
  // ─────────────────────────────────────────
  // CULTIVOS - Main crops table
  // ─────────────────────────────────────────
  "Cultivos": {
    headers: [
      "ID", 
      "Numero_Cultivo", 
      "ID_Ubicacion",
      "ID_Variedad", 
      "Fecha_Inicio", 
      "Fecha_Fin_Estimada", 
      "Total_Plantas", 
      "Tasa_Produccion_Planta",
      "Area_m2",
      "Numero_Camas",
      "Estado",
      "Observaciones"
    ],
    defaultData: [],
    columnWidths: { 1: 280, 2: 120, 3: 120, 4: 150, 5: 120, 6: 140, 7: 110, 8: 160, 9: 100, 10: 110, 11: 100, 12: 250 }
  },
  
  // ─────────────────────────────────────────
  // CICLOS_CULTIVO - Crop production cycles
  // ─────────────────────────────────────────
  "Ciclos_Cultivo": {
    headers: [
      "ID",
      "Consecutivo",
      "ID_Cultivo",
      "Ciclo_Produccion",
      "Nro_Semana",
      "Fecha_Planeada",
      "Tasa_Produccion",
      "Cantidad_Planeada",
      "Fecha_Efectiva",
      "Perdidas",
      "Cantidad_Producida",
      "Estado",
      "Observaciones"
    ],
    defaultData: [],
    columnWidths: { 1: 280, 2: 100, 3: 120, 4: 140, 5: 100, 6: 120, 7: 130, 8: 140, 9: 120, 10: 100, 11: 140, 12: 100, 13: 200 }
  },
  
  // ─────────────────────────────────────────
  // ACTIVIDADES_CULTIVO - Crop activities execution
  // ─────────────────────────────────────────
  "Actividades_Cultivo": {
    headers: [
      "ID",
      "Consecutivo",
      "ID_Cultivo",
      "ID_Actividad",
      "Nombre_Actividad",
      "Nro_Semana",
      "Fecha_Planeada",
      "Tiempo_Requerido_Min",
      "Tiempo_Efectivo_Min",
      "Responsable",
      "Estado",
      "Observaciones"
    ],
    defaultData: [],
    columnWidths: { 1: 280, 2: 100, 3: 120, 4: 120, 5: 150, 6: 100, 7: 120, 8: 150, 9: 150, 10: 130, 11: 100, 12: 200 }
  },
  
  // ─────────────────────────────────────────
  // INSUMOS_CULTIVO - Material requirements per crop
  // ─────────────────────────────────────────
  "Insumos_Cultivo": {
    headers: [
      "ID",
      "Consecutivo",
      "ID_Cultivo",
      "ID_Actividad_Cultivo",
      "ID_Insumo",
      "Nombre_Insumo",
      "Nro_Semana",
      "Fecha_Planeada",
      "Cantidad_Requerida",
      "Unidad_Medida",
      "Costo_Estimado",
      "Estado",
      "Observaciones"
    ],
    defaultData: [],
    columnWidths: { 1: 280, 2: 100, 3: 120, 4: 120, 5: 120, 6: 180, 7: 100, 8: 120, 9: 120, 10: 100, 11: 120, 12: 100, 13: 200 }
  },
  
  // ─────────────────────────────────────────
  // INSUMOS - Supplies/inputs catalog
  // ─────────────────────────────────────────
  "Insumos": {
    headers: [
      "ID",
      "Nombre",
      "Categoria",
      "Unidad_Medida",
      "Valor_Unitario",
      "Proveedor",
      "Fecha_Ultima_Compra",
      "Stock_Minimo",
      "Observaciones"
    ],
    defaultData: [],
    columnWidths: { 1: 280, 2: 180, 3: 130, 4: 120, 5: 120, 6: 150, 7: 150, 8: 110, 9: 200 }
  },
  
  // ─────────────────────────────────────────
  // COSTOS - Production costs
  // ─────────────────────────────────────────
  "Costos": {
    headers: [
      "ID",
      "ID_Ubicacion",
      "ID_Cultivo",
      "Fecha",
      "Tipo_Costo",
      "Descripcion",
      "Cantidad",
      "Unidad",
      "Costo_Unitario",
      "Costo_Total",
      "ID_Insumo",
      "ID_Actividad",
      "Responsable",
      "Observaciones"
    ],
    defaultData: [],
    columnWidths: { 1: 280, 2: 120, 3: 120, 4: 110, 5: 120, 6: 200, 7: 100, 8: 100, 9: 120, 10: 120, 11: 120, 12: 120, 13: 130, 14: 200 }
  },
  
  // ─────────────────────────────────────────
  // PRODUCCION - Production and Sales records (merged)
  // ─────────────────────────────────────────
  "Produccion": {
    headers: [
      "ID",
      "ID_Ubicacion",
      "ID_Cultivo",
      "ID_Ciclo_Cultivo",
      "Fecha",
      "Cantidad_Cosechada",
      "Unidad",
      "Perdidas",
      "Motivo_Perdida",
      "Moneda",
      "Precio_Venta",
      "Costo_Total",
      "Comprador",
      "Estado_Venta",
      "Observaciones"
    ],
    defaultData: [],
    columnWidths: { 1: 280, 2: 120, 3: 120, 4: 280, 5: 110, 6: 150, 7: 100, 8: 100, 9: 150, 10: 80, 11: 120, 12: 120, 13: 150, 14: 120, 15: 200 }
  }
};

// ==============================
// HELPER FUNCTIONS
// ==============================

/**
 * Generate a unique ID
 */
function generateId() {
  return Utilities.getUuid();
}

/**
 * Ensure Clases_Cultivo has default data if empty
 * Run this if the table exists but has no data
 */
function ensureClasesCultivoData() {
  const ss = SpreadsheetApp.getActive();
  let sheet = ss.getSheetByName("Clases_Cultivo");
  
  if (!sheet) {
    // Create the sheet if it doesn't exist
    sheet = ss.insertSheet("Clases_Cultivo");
    sheet.getRange(1, 1, 1, 4).setValues([["ID", "Nombre", "Fecha_Creacion", "Descripcion"]]);
    sheet.getRange(1, 1, 1, 4).setFontWeight("bold");
  }
  
  // Check if has data rows
  const lastRow = sheet.getLastRow();
  
  if (lastRow < 2) {
    // Add default data
    const defaultData = [
      [generateId(), "HORTENSIA", new Date(), "Hortensia - Hydrangea"],
      [generateId(), "ROSA", new Date(), "Rosa - Rose"],
      [generateId(), "CLAVEL", new Date(), "Clavel - Carnation"]
    ];
    
    sheet.getRange(2, 1, defaultData.length, 4).setValues(defaultData);
    
    SpreadsheetApp.getUi().alert("✅ Clases de Cultivo", 
      "Se agregaron 3 clases por defecto:\n- HORTENSIA\n- ROSA\n- CLAVEL", 
      SpreadsheetApp.getUi().ButtonSet.OK);
      
    return true;
  }
  
  return false;
}

/**
 * Ensure Actividades has correct column structure (includes ID_Variedad)
 */
function ensureActividadesStructure() {
  const ss = SpreadsheetApp.getActive();
  const sheet = ss.getSheetByName("Actividades");
  
  if (!sheet) return;
  
  const lastCol = sheet.getLastColumn();
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function(h) { return String(h || "").trim(); });
  const expectedHeaders = ["ID", "ID_Clase_Cultivo", "ID_Variedad", "Nombre_Actividad", "Semana_Actividad", "Categoria", "Tiempo_Por_Planta_Seg", "Requiere_Insumos", "Insumos_JSON", "Descripcion"];
  
  if (headers.join(",") === expectedHeaders.join(",")) return;
  
  // If old column was "Clase_Cultivo", notify
  if (headers.indexOf("Clase_Cultivo") !== -1) {
    SpreadsheetApp.getUi().alert("⚠️ Actividades Actualizada",
      "La columna 'Clase_Cultivo' fue renombrada a 'ID_Clase_Cultivo'.\nDeberá re-asociar las actividades con los IDs de las clases.",
      SpreadsheetApp.getUi().ButtonSet.OK);
  }
  
  // Add missing ID_Variedad column if present structure is the old 8-column one (no ID_Variedad)
  const idVariedadIdx = headers.indexOf("ID_Variedad");
  if (idVariedadIdx === -1 && headers.indexOf("ID_Clase_Cultivo") !== -1) {
    sheet.insertColumnAfter(2);
    sheet.getRange(1, 3).setValue("ID_Variedad");
    sheet.getRange(1, 3).setFontWeight("bold");
    sheet.getRange(1, 3).setBackground("#2d5016");
    sheet.getRange(1, 3).setFontColor("#ffffff");
    return;
  }
  
  // Add missing Insumos_JSON column (after Requiere_Insumos) if present structure has 9 columns
  const insumosJsonIdx = headers.indexOf("Insumos_JSON");
  if (insumosJsonIdx === -1 && headers.indexOf("Requiere_Insumos") !== -1) {
    const reqInsumosCol = headers.indexOf("Requiere_Insumos") + 1;
    sheet.insertColumnAfter(reqInsumosCol);
    sheet.getRange(1, reqInsumosCol + 1).setValue("Insumos_JSON");
    sheet.getRange(1, reqInsumosCol + 1).setFontWeight("bold");
    sheet.getRange(1, reqInsumosCol + 1).setBackground("#2d5016");
    sheet.getRange(1, reqInsumosCol + 1).setFontColor("#ffffff");
    return;
  }
  
  // Full header replace if still not matching
  if (sheet.getRange(1, 1, 1, lastCol).getValues()[0].join(",") !== expectedHeaders.join(",")) {
    sheet.getRange(1, 1, 1, expectedHeaders.length).setValues([expectedHeaders]);
    sheet.getRange(1, 1, 1, expectedHeaders.length).setFontWeight("bold");
    sheet.getRange(1, 1, 1, expectedHeaders.length).setBackground("#2d5016");
    sheet.getRange(1, 1, 1, expectedHeaders.length).setFontColor("#ffffff");
  }
}

/**
 * Populate default activities after Clases_Cultivo is created
 */
function populateDefaultActivities() {
  const ss = SpreadsheetApp.getActive();
  const clasesSheet = ss.getSheetByName("Clases_Cultivo");
  const actividadesSheet = ss.getSheetByName("Actividades");
  
  if (!clasesSheet || !actividadesSheet) return;
  
  // Ensure correct structure first
  ensureActividadesStructure();
  
  // Only populate if Actividades is empty (no data rows)
  if (actividadesSheet.getLastRow() > 1) return;
  
  // Get HORTENSIA ID
  const clasesData = clasesSheet.getDataRange().getValues();
  let hortensiaId = null;
  
  for (let i = 1; i < clasesData.length; i++) {
    if (clasesData[i][1] === "HORTENSIA") {
      hortensiaId = clasesData[i][0];
      break;
    }
  }
  
  if (!hortensiaId) return;
  
  // Add default activities for HORTENSIA (9 cols: ID, ID_Clase_Cultivo, ID_Variedad empty, then rest)
  const defaultActivities = [
    [generateId(), hortensiaId, "", "Siembra", 1, "Establecimiento", 30, "Sí", "Siembra de plántulas en sustrato"],
    [generateId(), hortensiaId, "", "Riego", 0, "Mantenimiento", 5, "No", "Riego manual o por sistema"],
    [generateId(), hortensiaId, "", "Fertilización", 0, "Mantenimiento", 10, "Sí", "Aplicación de fertilizantes"],
    [generateId(), hortensiaId, "", "Control de Plagas", 0, "Mantenimiento", 15, "Sí", "Aplicación de pesticidas"],
    [generateId(), hortensiaId, "", "Poda de Formación", 4, "Mantenimiento", 45, "No", "Poda para dar forma a la planta"],
    [generateId(), hortensiaId, "", "Deshoje", 6, "Mantenimiento", 25, "No", "Eliminación de hojas secas o enfermas"],
    [generateId(), hortensiaId, "", "Tutorado", 5, "Mantenimiento", 20, "Sí", "Colocación de tutores"],
    [generateId(), hortensiaId, "", "Desbotonado", 8, "Producción", 35, "No", "Eliminación de botones laterales"],
    [generateId(), hortensiaId, "", "Cosecha", 12, "Producción", 20, "No", "Recolección de tallos"],
    [generateId(), hortensiaId, "", "Empaque", 12, "Postcosecha", 30, "Sí", "Empaque del producto para venta"]
  ];
  
  const lastRow = actividadesSheet.getLastRow();
  actividadesSheet.getRange(lastRow + 1, 1, defaultActivities.length, defaultActivities[0].length).setValues(defaultActivities);
}

/**
 * Show current status of all sheets
 */
function showSheetStatus() {
  const ss = SpreadsheetApp.getActive();
  const ui = SpreadsheetApp.getUi();
  
  let message = "🌱 ESTADO ACTUAL DE LAS HOJAS\n\n";
  
  for (const [name, config] of Object.entries(FARM_TABLE_DEFINITIONS)) {
    const sheet = ss.getSheetByName(name);
    
    if (sheet) {
      const rows = sheet.getLastRow();
      const cols = sheet.getLastColumn();
      const dataRows = Math.max(0, rows - 1);
      message += `✅ ${name}\n   Filas de datos: ${dataRows} | Columnas: ${cols}/${config.headers.length}\n\n`;
    } else {
      message += `❌ ${name}\n   NO EXISTE\n\n`;
    }
  }
  
  ui.alert("Estado de Hojas", message, ui.ButtonSet.OK);
}

/**
 * Get table headers
 */
function getTableHeaders(sheetName) {
  const config = FARM_TABLE_DEFINITIONS[sheetName];
  return config ? config.headers : [];
}

/**
 * Validate if a sheet has required structure
 */
function validateSheetStructure(sheetName) {
  const ss = SpreadsheetApp.getActive();
  const sheet = ss.getSheetByName(sheetName);
  const config = FARM_TABLE_DEFINITIONS[sheetName];
  
  if (!sheet) return { valid: false, message: "La hoja no existe" };
  if (!config) return { valid: false, message: "No hay definición para esta hoja" };
  
  const lastCol = sheet.getLastColumn();
  if (lastCol < 1) return { valid: false, message: "La hoja está vacía" };
  
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  const missing = config.headers.filter(h => !headers.includes(h));
  
  if (missing.length > 0) {
    return { 
      valid: false, 
      message: `Faltan columnas: ${missing.join(", ")}` 
    };
  }
  
  return { valid: true, message: "Estructura válida" };
}
