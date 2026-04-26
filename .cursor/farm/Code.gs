// ==============================
// CODE.GS - Farm Management System
// Core functionality for managing crops, costs, and production
// ==============================

/**
 * Creates the menu when the spreadsheet opens
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("🌾 FarmManager")
    .addItem("Abrir Panel de Control", "openFarmPanel")
    .addSeparator()
    .addItem("Configurar Hojas", "setupAllTables")
    .addItem("Ver Estado de Hojas", "showSheetStatus")
    .addSeparator()
    .addSubMenu(SpreadsheetApp.getUi().createMenu("🌱 Cultivos")
      .addItem("Nuevo Cultivo", "showNewCultivoDialog")
      .addItem("Ver Cultivos Activos", "showActiveCultivos"))
    .addSubMenu(SpreadsheetApp.getUi().createMenu("💰 Costos")
      .addItem("Registrar Costo", "showNewCostoDialog")
      .addItem("Resumen de Costos", "showCostsSummary"))
    .addSubMenu(SpreadsheetApp.getUi().createMenu("📊 Reportes")
      .addItem("Resumen General", "showGeneralSummary")
      .addItem("Costos por Cultivo", "showCostsByCultivo"))
    .addToUi();
}

/**
 * Opens the main Farm Panel (placeholder - will be HTML)
 */
function openFarmPanel() {
  const html = HtmlService.createHtmlOutputFromFile("FarmPanel")
    .setWidth(1200)
    .setHeight(800);
  SpreadsheetApp.getUi().showModalDialog(html, "🌾 Farm Manager - Panel de Control");
}

/**
 * Web app entry point
 */
function doGet() {
  return HtmlService.createHtmlOutputFromFile("FarmPanel")
    .setTitle("Farm Manager")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// ==============================
// AUTHENTICATION
// Simple token-based auth (can use session cache)
// ==============================

const _AUTH_CACHE_PREFIX_ = "FARM_AUTH_v1:";
const _AUTH_TTL_SECONDS_ = 60 * 60 * 8; // 8 hours

function _authNormalizeRole_(role) {
  const r = String(role || "").trim().toLowerCase();
  if (r === "administrador" || r === "admin") return "Administrador";
  if (r === "agricultor" || r === "farmer") return "Agricultor";
  if (r === "trabajador" || r === "worker") return "Trabajador";
  return "";
}

function _authIssueToken_(username, role) {
  const token = Utilities.getUuid();
  const payload = JSON.stringify({
    username: String(username || "").trim(),
    role: _authNormalizeRole_(role),
    issuedAt: new Date().toISOString()
  });

  const cache = CacheService.getScriptCache();
  cache.put(_AUTH_CACHE_PREFIX_ + token, payload, _AUTH_TTL_SECONDS_);
  return token;
}

function _authGetSession_(token) {
  const t = String(token || "").trim();
  if (!t) return null;
  const cache = CacheService.getScriptCache();
  const raw = cache.get(_AUTH_CACHE_PREFIX_ + t);
  if (!raw) return null;
  try {
    const obj = JSON.parse(raw);
    if (!obj || !obj.username || !obj.role) return null;
    return { username: String(obj.username), role: _authNormalizeRole_(obj.role) };
  } catch (e) {
    return null;
  }
}

function _authRequire_(token) {
  const s = _authGetSession_(token);
  if (!s) throw new Error("No autenticado. Inicie sesión nuevamente.");
  if (!s.role) throw new Error("Rol inválido. Revise la hoja Usuarios.");
  return s;
}

function _authRequireAdmin_(token) {
  const s = _authRequire_(token);
  if (s.role !== "Administrador") throw new Error("Acceso denegado (solo Administrador).");
  return s;
}

function authenticateUser(username, clave) {
  try {
    const u = String(username || "").trim();
    const p = String(clave || "").trim();

    // Hardcoded admin fallback
    if (u.toLowerCase() === "admin" && p === "admin") {
      const token = _authIssueToken_("admin", "Administrador");
      return { success: true, token, user: { username: "admin", role: "Administrador" } };
    }

    const ss = SpreadsheetApp.getActive();
    const sheet = ss.getSheetByName("Usuarios");
    if (!sheet) return { success: false, message: "No existe la hoja 'Usuarios'." };

    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();
    if (lastRow < 2) return { success: false, message: "No hay usuarios registrados." };

    const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(h => String(h || "").trim());
    const idxNombre = headers.indexOf("Nombre");
    const idxClave = headers.indexOf("Clave");
    const idxRole = headers.indexOf("Role");
    
    if (idxNombre === -1 || idxClave === -1 || idxRole === -1) {
      return { success: false, message: "La hoja 'Usuarios' debe tener columnas: Nombre, Clave, Role." };
    }

    const data = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
    const found = data.find(r => String(r[idxNombre] || "").trim().toLowerCase() === u.toLowerCase());
    
    if (!found) return { success: false, message: "Usuario o clave inválidos." };
    if (String(found[idxClave] || "").trim() !== p) return { success: false, message: "Usuario o clave inválidos." };

    const role = _authNormalizeRole_(found[idxRole]);
    if (!role) return { success: false, message: "Rol inválido. Use: Administrador, Agricultor o Trabajador." };

    const token = _authIssueToken_(u, role);
    return { success: true, token, user: { username: u, role } };
  } catch (e) {
    return { success: false, message: "Error: " + e.message };
  }
}

function logoutUser(token) {
  try {
    const t = String(token || "").trim();
    if (t) CacheService.getScriptCache().remove(_AUTH_CACHE_PREFIX_ + t);
    return { success: true };
  } catch (e) {
    return { success: false, message: "Error: " + e.message };
  }
}

function getSessionInfo(token) {
  const s = _authGetSession_(token);
  if (!s) return { success: false, message: "No autenticado" };
  return { success: true, user: s };
}

// ==============================
// CONFIGURATION HELPERS
// ==============================

function _getConfigValue_(variableName) {
  const ss = SpreadsheetApp.getActive();
  const sheet = ss.getSheetByName("Configuracion");
  if (!sheet) return null;
  
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return null;
  
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const variableIndex = headers.indexOf("Variable");
  const valorIndex = headers.indexOf("Valor");
  
  if (variableIndex === -1 || valorIndex === -1) return null;
  
  const data = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues();
  for (let i = 0; i < data.length; i++) {
    if (String(data[i][variableIndex] || "").trim() === variableName) {
      return data[i][valorIndex];
    }
  }
  return null;
}

function getTasaCambio() {
  return Number(_getConfigValue_("TASA_CAMBIO")) || 4200;
}

function getJornalDia() {
  return Number(_getConfigValue_("JORNAL_DIA")) || 65000;
}

function getHorasJornal() {
  return Number(_getConfigValue_("HORAS_JORNAL")) || 8;
}

function getClasesCultivo() {
  try {
    const ss = SpreadsheetApp.getActive();
    const sheet = ss.getSheetByName("Clases_Cultivo");
    
    if (!sheet) return [];
    
    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();
    if (lastRow < 2) return [];
    
    const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    const data = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
    
    // Return array of objects using actual column headers
    return data.map(row => {
      const obj = {};
      headers.forEach((h, i) => {
        if (h) obj[h] = row[i];
      });
      return obj;
    }).filter(c => c.Nombre); // Filter out rows without Nombre
    
  } catch (error) {
    Logger.log("Error getClasesCultivo: " + error);
    return [];
  }
}

function updateClasesCultivo(token, clasesArray) {
  _authRequire_(token);
  
  // This function is now deprecated - use standard addRow/updateRow/deleteRow with Clases_Cultivo table
  return { success: false, message: "Use addRow/updateRow/deleteRow en tabla Clases_Cultivo" };
}

// ==============================
// GENERIC CRUD OPERATIONS
// ==============================

/**
 * Get list of all sheets
 */
function getSheets(token) {
  try {
    _authRequire_(token);
    const sheets = SpreadsheetApp.getActive().getSheets();
    return sheets.map(s => s.getName()).sort();
  } catch (error) {
    throw new Error("Error al obtener hojas: " + error.message);
  }
}

/**
 * Get table data with headers
 */
function getTable(token, sheetName) {
  try {
    _authRequire_(token);
    const sheet = SpreadsheetApp.getActive().getSheetByName(sheetName);
    if (!sheet) throw new Error("La hoja '" + sheetName + "' no existe");

    // Ensure ID column exists
    checkAndSetupIds(sheet);

    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();

    if (lastRow === 0 || lastCol === 0) {
      return { headers: [], rows: [] };
    }

    const data = sheet.getRange(1, 1, lastRow, lastCol).getValues();
    let headers = data[0];
    let rows = data.slice(1);

    // Convert Date objects to strings for JSON safety
    let formattedRows = rows.map(row => row.map(cell =>
      (cell instanceof Date) ? Utilities.formatDate(cell, Session.getScriptTimeZone(), "yyyy-MM-dd") : cell
    ));

    // Insumos: do not expose Cantidad_Stock and Valor_Total
    if (sheetName === "Insumos") {
      const idxStock = headers.indexOf("Cantidad_Stock");
      const idxTotal = headers.indexOf("Valor_Total");
      const drop = [idxStock, idxTotal].filter(i => i !== -1).sort((a, b) => b - a);
      if (drop.length) {
        headers = headers.filter((_, i) => drop.indexOf(i) === -1);
        formattedRows = formattedRows.map(row => row.filter((_, i) => drop.indexOf(i) === -1));
      }
    }

    return {
      headers: headers,
      rows: formattedRows
    };
  } catch (error) {
    throw new Error("Error al cargar datos: " + error.message);
  }
}

/**
 * Helper to ensure Column A is ID
 */
function checkAndSetupIds(sheet) {
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  
  // If empty sheet, just set header
  if (lastRow === 0) {
    sheet.getRange(1, 1).setValue("ID");
    return;
  }

  const firstCell = sheet.getRange(1, 1).getValue();
  
  // If first column is NOT "ID", insert it
  if (firstCell !== "ID") {
    sheet.insertColumnBefore(1);
    sheet.getRange(1, 1).setValue("ID");
    // Generate IDs for existing rows
    if (lastRow > 1) {
      const ids = [];
      for (let i = 0; i < lastRow - 1; i++) {
        ids.push([Utilities.getUuid()]);
      }
      sheet.getRange(2, 1, ids.length, 1).setValues(ids);
    }
  } else {
    // Audit: Fill missing IDs if any
    if (lastRow > 1) {
      const idRange = sheet.getRange(2, 1, lastRow - 1, 1);
      const ids = idRange.getValues();
      let hasMissing = false;
      const newIds = ids.map(row => {
        if (!row[0] || row[0] === "") {
          hasMissing = true;
          return [Utilities.getUuid()];
        }
        return row;
      });
      if (hasMissing) {
        idRange.setValues(newIds);
      }
    }
  }
}

/**
 * Add a single row to a sheet
 */
function addRow(token, sheetName, rowData) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
    _authRequire_(token);
    
    if (sheetName === "Actividades") {
      const hasClase = rowData.ID_Clase_Cultivo != null && String(rowData.ID_Clase_Cultivo).trim() !== "";
      const hasVariedad = rowData.ID_Variedad != null && String(rowData.ID_Variedad).trim() !== "";
      if (hasClase && hasVariedad) {
        return { success: false, message: "Actividad debe estar asociada solo a cultivo o solo a variedad, no a ambos." };
      }
      if (!hasClase && !hasVariedad) {
        return { success: false, message: "Actividad debe estar asociada a un cultivo o a una variedad." };
      }
    }
    
    const ss = SpreadsheetApp.getActive();
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) throw new Error("Hoja no encontrada: " + sheetName);
    
    checkAndSetupIds(sheet);
    
    const lastCol = sheet.getLastColumn();
    const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    
    // Build row aligned to headers
    const row = [];
    const newId = Utilities.getUuid();
    
    headers.forEach((header, idx) => {
      if (header === "ID") {
        row.push(newId);
      } else if (rowData.hasOwnProperty(header)) {
        row.push(rowData[header]);
      } else {
        row.push("");
      }
    });
    
    const lastRow = sheet.getLastRow();
    sheet.getRange(lastRow + 1, 1, 1, row.length).setValues([row]);
    
    return { success: true, message: "Registro agregado exitosamente", id: newId };
  } catch (e) {
    return { success: false, message: "Error: " + e.message };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Update a row by ID
 */
function updateRow(token, sheetName, id, rowData) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
    _authRequire_(token);
    
    const ss = SpreadsheetApp.getActive();
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) throw new Error("Hoja no encontrada: " + sheetName);
    
    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();
    if (lastRow < 2) throw new Error("No hay datos para actualizar");
    
    const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    const idIndex = headers.indexOf("ID");
    if (idIndex === -1) throw new Error("No existe columna ID");
    
    const data = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
    let foundRowIndex = -1;
    
    for (let i = 0; i < data.length; i++) {
      if (String(data[i][idIndex] || "").trim() === String(id).trim()) {
        foundRowIndex = i;
        break;
      }
    }
    
    if (foundRowIndex === -1) throw new Error("Registro no encontrado");
    
    // Update row
    const row = data[foundRowIndex].slice();
    headers.forEach((header, idx) => {
      if (header !== "ID" && rowData.hasOwnProperty(header)) {
        row[idx] = rowData[header];
      }
    });
    
    const sheetRowIndex = foundRowIndex + 2;
    sheet.getRange(sheetRowIndex, 1, 1, row.length).setValues([row]);
    
    return { success: true, message: "Registro actualizado exitosamente" };
  } catch (e) {
    return { success: false, message: "Error: " + e.message };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Delete a row by ID
 */
function deleteRow(token, sheetName, id) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
    _authRequire_(token);
    
    const ss = SpreadsheetApp.getActive();
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) throw new Error("Hoja no encontrada: " + sheetName);
    
    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();
    if (lastRow < 2) throw new Error("No hay datos para eliminar");
    
    const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    const idIndex = headers.indexOf("ID");
    if (idIndex === -1) throw new Error("No existe columna ID");
    
    const data = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
    let foundRowIndex = -1;
    
    for (let i = 0; i < data.length; i++) {
      if (String(data[i][idIndex] || "").trim() === String(id).trim()) {
        foundRowIndex = i;
        break;
      }
    }
    
    if (foundRowIndex === -1) throw new Error("Registro no encontrado");
    
    // Before deleting, if this is Costos table, revert linked records
    if (sheetName === "Costos") {
      const rowData = data[foundRowIndex];
      const idInsumoIdx = headers.indexOf("ID_Insumo");
      const idActividadIdx = headers.indexOf("ID_Actividad");
      
      if (idInsumoIdx !== -1 && rowData[idInsumoIdx]) {
        _updateInsumosCultivoEstadoByInsumoId_(rowData[idInsumoIdx], 'Pendiente');
      }
      
      if (idActividadIdx !== -1 && rowData[idActividadIdx]) {
        _updateActividadesCultivoEstado_(rowData[idActividadIdx], 'Pendiente', 0);
      }
    }
    
    const sheetRowIndex = foundRowIndex + 2;
    sheet.deleteRow(sheetRowIndex);
    
    return { success: true, message: "Registro eliminado exitosamente" };
  } catch (e) {
    return { success: false, message: "Error: " + e.message };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Sync entire table (batch update/insert/delete)
 */
function syncTable(token, sheetName, clientHeaders, clientRows) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
    _authRequire_(token);

    const sheet = SpreadsheetApp.getActive().getSheetByName(sheetName);
    if (!sheet) throw new Error("Hoja no encontrada");

    checkAndSetupIds(sheet);

    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();
    const serverHeaders = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    
    if (serverHeaders[0] !== "ID") throw new Error("La columna A debe ser ID");

    // Read all data rows
    const serverDataMap = new Map();
    if (lastRow > 1) {
      const data = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
      data.forEach((row, index) => {
        const id = row[0].toString();
        if (id) {
          serverDataMap.set(id, { 
            rowIndex: index + 2,
            values: row 
          });
        }
      });
    }

    const rowsToDeleteIndices = []; 
    const rowsToAppend = [];
    const updates = [];
    const clientIdSet = new Set();

    // Process client rows
    for (let i = 0; i < clientRows.length; i++) {
      const row = clientRows[i];
      const id = row[0];

      if (!id || id === "" || id === "(nuevo)") {
        row[0] = Utilities.getUuid();
        rowsToAppend.push(row);
      } else {
        clientIdSet.add(id.toString());
        
        if (serverDataMap.has(id.toString())) {
          const serverInfo = serverDataMap.get(id.toString());
          if (JSON.stringify(serverInfo.values) !== JSON.stringify(row)) {
            updates.push({
              rowIndex: serverInfo.rowIndex,
              values: row
            });
          }
        } else {
          rowsToAppend.push(row);
        }
      }
    }

    // Identify deletions
    serverDataMap.forEach((info, id) => {
      if (!clientIdSet.has(id)) {
        rowsToDeleteIndices.push(info.rowIndex);
      }
    });

    // Apply updates
    updates.forEach(u => {
      if (u.values.length > 0) {
        sheet.getRange(u.rowIndex, 1, 1, u.values.length).setValues([u.values]);
      }
    });

    // Apply deletions (bottom up)
    rowsToDeleteIndices.sort((a, b) => b - a);
    rowsToDeleteIndices.forEach(rowIndex => {
      sheet.deleteRow(rowIndex);
    });

    // Apply appends
    if (rowsToAppend.length > 0) {
      const startRow = sheet.getLastRow() + 1;
      const numRows = rowsToAppend.length;
      const numCols = rowsToAppend[0].length;
      sheet.getRange(startRow, 1, numRows, numCols).setValues(rowsToAppend);
    }

    return { 
      success: true, 
      message: `Guardado: ${updates.length} actualizados, ${rowsToAppend.length} creados, ${rowsToDeleteIndices.length} eliminados.`
    };

  } catch (error) {
    return { success: false, message: "Error Sync: " + error.message };
  } finally {
    lock.releaseLock();
  }
}

// ==============================
// DROPDOWN DATA (For forms)
// ==============================

/**
 * TEST FUNCTION - Run this to verify dropdown data loads
 * Go to Apps Script > Select "testDropdownData" > Run > Check Logs
 */
function testDropdownData() {
  const ss = SpreadsheetApp.getActive();
  
  const getRowsAsObjects = (sheetName) => {
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      Logger.log(sheetName + ': Sheet not found');
      return [];
    }
    
    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();
    if (lastRow < 2) {
      Logger.log(sheetName + ': No data rows');
      return [];
    }
    
    const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    const data = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
    
    const result = data.map(row => {
      const obj = {};
      headers.forEach((h, i) => {
        if (h) obj[h] = row[i];
      });
      return obj;
    });
    
    Logger.log(sheetName + ': Found ' + result.length + ' rows');
    Logger.log(sheetName + ' sample: ' + JSON.stringify(result[0]));
    return result;
  };
  
  Logger.log('=== Testing Dropdown Data ===');
  const clasesCultivo = getRowsAsObjects('Clases_Cultivo');
  const ubicaciones = getRowsAsObjects('Ubicaciones');
  const variedades = getRowsAsObjects('Variedades');
  
  Logger.log('=== Results ===');
  Logger.log('clasesCultivo count: ' + clasesCultivo.length);
  Logger.log('ubicaciones count: ' + ubicaciones.length);
  Logger.log('variedades count: ' + variedades.length);
}

/**
 * Get dropdown options for forms
 */
function getDropdownData(token) {
  try {
    _authRequire_(token);
    const ss = SpreadsheetApp.getActive();
    
    const getColumnValues = (sheetName, colHeader) => {
      const sheet = ss.getSheetByName(sheetName);
      if (!sheet) return [];
      
      const lastRow = sheet.getLastRow();
      if (lastRow < 2) return [];
      
      const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      const colIndex = headers.indexOf(colHeader);
      
      if (colIndex === -1) return [];
      
      const values = sheet.getRange(2, colIndex + 1, lastRow - 1, 1).getValues();
      return values.map(r => r[0]).filter(v => v !== "" && v !== null);
    };
    
    const getRowsAsObjects = (sheetName) => {
      const sheet = ss.getSheetByName(sheetName);
      if (!sheet) return [];
      
      const lastRow = sheet.getLastRow();
      const lastCol = sheet.getLastColumn();
      if (lastRow < 2) return [];
      
      const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
      const data = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
      
      return data.map(row => {
        const obj = {};
        headers.forEach((h, i) => {
          if (h) obj[h] = row[i];
        });
        return obj;
      });
    };
    
    // Sanitize data to ensure proper serialization (dates, whitespace in keys)
    const sanitize = (arr) => {
      return arr.map(obj => {
        const clean = {};
        for (const key in obj) {
          let val = obj[key];
          if (val instanceof Date) {
            val = val.toISOString();
          }
          clean[String(key).trim()] = val;
        }
        return clean;
      });
    };

    return {
      ubicaciones: sanitize(getRowsAsObjects("Ubicaciones")),
      variedades: sanitize(getRowsAsObjects("Variedades")),
      actividades: sanitize(getRowsAsObjects("Actividades")),
      insumos: sanitize(getRowsAsObjects("Insumos")),
      cultivos: sanitize(getRowsAsObjects("Cultivos")),
      usuarios: getColumnValues("Usuarios", "Nombre"),
      clasesCultivo: sanitize(getRowsAsObjects("Clases_Cultivo")),
      tiposCosto: ["INSUMO", "MANO_OBRA", "ARRENDAMIENTO", "SERVICIO", "OTRO"],
      categoriasCosto: ["Fertilizacion", "Control de Plagas", "Cosecha", "Transporte", "Administracion", "Riego", "Otros"],
      unidades: ["kg", "lb", "unidades", "horas", "jornales", "dias", "litros", "galones"],
      estadosCultivo: ["Planeado", "En Progreso", "Cosechando", "Finalizado", "Cancelado"],
      estadosActividad: ["Pendiente", "En Progreso", "Completado", "Cancelado"],
      calidades: ["Primera", "Segunda", "Tercera", "Rechazo"],
      config: {
        tasaCambio: getTasaCambio(),
        jornalDia: getJornalDia(),
        horasJornal: getHorasJornal()
      }
    };
  } catch (e) {
    Logger.log("getDropdownData error: " + e.message);
    throw new Error("Error cargando datos: " + e.message);
  }
}

// ==============================
// CULTIVOS (Crops) - Specific Operations
// ==============================

/**
 * Get active crops with summary info
 */
function getCultivosActivos(token) {
  try {
    _authRequire_(token);
    const ss = SpreadsheetApp.getActive();
    const sheet = ss.getSheetByName("Cultivos");
    
    if (!sheet) return { success: false, message: "No existe la hoja Cultivos", data: [] };
    
    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();
    if (lastRow < 2) return { success: true, data: [] };
    
    const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    const data = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
    
    const idx = (name) => headers.indexOf(name);
    const estadoIdx = idx("Estado");
    
    const cultivos = data
      .filter(row => {
        const estado = String(row[estadoIdx] || "").toLowerCase();
        return estado !== "finalizado" && estado !== "cancelado";
      })
      .map(row => {
        const obj = {};
        headers.forEach((h, i) => {
          if (h) {
            if (row[i] instanceof Date) {
              obj[h] = Utilities.formatDate(row[i], Session.getScriptTimeZone(), "yyyy-MM-dd");
            } else {
              obj[h] = row[i];
            }
          }
        });
        return obj;
      });
    
    return { success: true, data: cultivos };
  } catch (e) {
    return { success: false, message: "Error: " + e.message, data: [] };
  }
}

/**
 * Get costs summary by cultivo
 */
function getCostosPorCultivo(token, cultivoId) {
  try {
    _authRequire_(token);
    const ss = SpreadsheetApp.getActive();
    const sheet = ss.getSheetByName("Costos");
    
    if (!sheet) return { success: false, message: "No existe la hoja Costos", data: null };
    
    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();
    if (lastRow < 2) return { success: true, data: { total: 0, porTipo: {}, porCategoria: {} } };
    
    const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    const data = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
    
    const idCultivoIdx = headers.indexOf("ID_Cultivo");
    const tipoIdx = headers.indexOf("Tipo_Costo");
    const categoriaIdx = headers.indexOf("Categoria");
    const costoTotalIdx = headers.indexOf("Costo_Total");
    
    let total = 0;
    const porTipo = {};
    const porCategoria = {};
    
    data.forEach(row => {
      if (String(row[idCultivoIdx] || "").trim() === String(cultivoId).trim()) {
        const costo = Number(row[costoTotalIdx]) || 0;
        const tipo = String(row[tipoIdx] || "OTRO");
        const categoria = String(row[categoriaIdx] || "Otros");
        
        total += costo;
        porTipo[tipo] = (porTipo[tipo] || 0) + costo;
        porCategoria[categoria] = (porCategoria[categoria] || 0) + costo;
      }
    });
    
    return { 
      success: true, 
      data: { 
        total, 
        porTipo, 
        porCategoria 
      } 
    };
  } catch (e) {
    return { success: false, message: "Error: " + e.message, data: null };
  }
}

// ==============================
// COSTOS - Quick Registration
// ==============================

/**
 * Register a new cost (simplified)
 */
function registrarCosto(token, costoData) {
  try {
    _authRequire_(token);
    
    // Calculate total if not provided
    if (!costoData.Costo_Total && costoData.Cantidad && costoData.Costo_Unitario) {
      costoData.Costo_Total = Number(costoData.Cantidad) * Number(costoData.Costo_Unitario);
    }
    
    // Set date if not provided
    if (!costoData.Fecha) {
      costoData.Fecha = new Date();
    }
    
    const result = addRow(token, "Costos", costoData);
    
    // Auto-update linked records if successful
    if (result.success) {
      // Update Insumos_Cultivo if INSUMO type
      if (costoData.Tipo_Costo === 'INSUMO' && costoData.ID_Insumo) {
        _updateInsumosCultivoEstadoByInsumoId_(costoData.ID_Insumo, 'Aplicado');
      }
      
      // Update Actividades_Cultivo if MANO_OBRA type
      if (costoData.Tipo_Costo === 'MANO_OBRA' && costoData.ID_Actividad) {
        const tiempoMin = Number(costoData.Cantidad) || 0;
        _updateActividadesCultivoEstado_(costoData.ID_Actividad, 'Completado', tiempoMin);
      }
    }
    
    return result;
  } catch (e) {
    return { success: false, message: "Error: " + e.message };
  }
}

/**
 * Helper: Update Insumos_Cultivo Estado by ID_Insumo reference
 */
function _updateInsumosCultivoEstadoByInsumoId_(idInsumo, estado) {
  try {
    const ss = SpreadsheetApp.getActive();
    const sheet = ss.getSheetByName("Insumos_Cultivo");
    if (!sheet) return;
    
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return;
    
    const headers = data[0];
    const idInsumoIdx = headers.indexOf("ID_Insumo");
    const estadoIdx = headers.indexOf("Estado");
    
    if (idInsumoIdx === -1 || estadoIdx === -1) return;
    
    // Find and update matching row
    for (let i = 1; i < data.length; i++) {
      if (data[i][idInsumoIdx] === idInsumo) {
        sheet.getRange(i + 1, estadoIdx + 1).setValue(estado);
        break; // Update first match only
      }
    }
  } catch (e) {
    Logger.log("Error updating Insumos_Cultivo: " + e.message);
  }
}

/**
 * Helper: Update Actividades_Cultivo Estado and Tiempo_Efectivo_Min
 */
function _updateActividadesCultivoEstado_(idActividad, estado, tiempoEfectivo) {
  try {
    const ss = SpreadsheetApp.getActive();
    const sheet = ss.getSheetByName("Actividades_Cultivo");
    if (!sheet) return;
    
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return;
    
    const headers = data[0];
    const idIdx = headers.indexOf("ID");
    const estadoIdx = headers.indexOf("Estado");
    const tiempoEfectivoIdx = headers.indexOf("Tiempo_Efectivo_Min");
    
    if (idIdx === -1 || estadoIdx === -1) return;
    
    // Find and update matching row
    for (let i = 1; i < data.length; i++) {
      if (data[i][idIdx] === idActividad) {
        sheet.getRange(i + 1, estadoIdx + 1).setValue(estado);
        if (tiempoEfectivoIdx !== -1 && tiempoEfectivo) {
          sheet.getRange(i + 1, tiempoEfectivoIdx + 1).setValue(tiempoEfectivo);
        }
        break;
      }
    }
  } catch (e) {
    Logger.log("Error updating Actividades_Cultivo: " + e.message);
  }
}

/**
 * Register labor cost
 */
function registrarManoObra(token, laborData) {
  try {
    _authRequire_(token);
    
    // Calculate total
    const valorHora = Number(laborData.Valor_Hora) || (getJornalDia() / getHorasJornal());
    const horasTrabajadas = Number(laborData.Horas_Trabajadas) || 0;
    laborData.Valor_Total = horasTrabajadas * valorHora;
    
    // Set date if not provided
    if (!laborData.Fecha) {
      laborData.Fecha = new Date();
    }
    
    // Add to Mano_Obra sheet
    const result = addRow(token, "Mano_Obra", laborData);
    
    // Also add to Costos for unified reporting
    if (result.success && laborData.ID_Cultivo) {
      const costoData = {
        ID_Cultivo: laborData.ID_Cultivo,
        Fecha: laborData.Fecha,
        Tipo_Costo: "MANO_OBRA",
        Categoria: laborData.Actividad || "Mano de Obra",
        Descripcion: `${laborData.Trabajador || "Trabajador"} - ${laborData.Actividad || "Trabajo"}`,
        Cantidad: horasTrabajadas,
        Unidad: "horas",
        Costo_Unitario: valorHora,
        Costo_Total: laborData.Valor_Total,
        ID_Actividad: laborData.ID_Actividad || ""
      };
      addRow(token, "Costos", costoData);
    }
    
    return result;
  } catch (e) {
    return { success: false, message: "Error: " + e.message };
  }
}

// ==============================
// PRODUCCION - Production Records
// ==============================

/**
 * Get Ciclos_Cultivo for a specific cultivo
 * Returns cycles with formatted display info for dropdown
 */
function getCiclosCultivoForCultivo(token, cultivoId) {
  try {
    _authRequire_(token);
    
    const ss = SpreadsheetApp.getActive();
    const ciclosSheet = ss.getSheetByName("Ciclos_Cultivo");
    
    if (!ciclosSheet) {
      return { success: true, ciclos: [] };
    }
    
    const lastRow = ciclosSheet.getLastRow();
    if (lastRow < 2) {
      return { success: true, ciclos: [] };
    }
    
    const headers = ciclosSheet.getRange(1, 1, 1, ciclosSheet.getLastColumn()).getValues()[0];
    const data = ciclosSheet.getRange(2, 1, lastRow - 1, ciclosSheet.getLastColumn()).getValues();
    
    const idIdx = headers.indexOf("ID");
    const idCultivoIdx = headers.indexOf("ID_Cultivo");
    const cicloProduccionIdx = headers.indexOf("Ciclo_Produccion");
    const nroSemanaIdx = headers.indexOf("Nro_Semana");
    const fechaPlaneadaIdx = headers.indexOf("Fecha_Planeada");
    const cantidadPlaneadaIdx = headers.indexOf("Cantidad_Planeada");
    
    const ciclos = [];
    for (let i = 0; i < data.length; i++) {
      if (String(data[i][idCultivoIdx]) === String(cultivoId)) {
        const fechaPlaneada = data[i][fechaPlaneadaIdx];
        ciclos.push({
          ID: data[i][idIdx],
          Ciclo_Produccion: data[i][cicloProduccionIdx] || '',
          Nro_Semana: Number(data[i][nroSemanaIdx]) || 0,
          Fecha_Planeada: fechaPlaneada instanceof Date ? 
            Utilities.formatDate(fechaPlaneada, Session.getScriptTimeZone(), "yyyy-MM-dd") : 
            (fechaPlaneada || ''),
          Cantidad_Planeada: Number(data[i][cantidadPlaneadaIdx]) || 0
        });
      }
    }
    
    // Sort by week number
    ciclos.sort((a, b) => a.Nro_Semana - b.Nro_Semana);
    
    return { success: true, ciclos: ciclos };
  } catch (e) {
    return { success: false, message: "Error: " + e.message };
  }
}

/**
 * Register production/harvest
 */
function registrarProduccion(token, produccionData) {
  try {
    _authRequire_(token);
    
    // Set date if not provided
    if (!produccionData.Fecha) {
      produccionData.Fecha = new Date();
    }
    
    const result = addRow(token, "Produccion", produccionData);
    
    // Auto-update Ciclos_Cultivo if successful and ID_Ciclo_Cultivo is set
    if (result.success && produccionData.ID_Ciclo_Cultivo) {
      const cantidadCosechada = Number(produccionData.Cantidad_Cosechada) || 0;
      const perdidas = Number(produccionData.Perdidas) || 0;
      _updateCicloCultivoProduccion_(produccionData.ID_Ciclo_Cultivo, cantidadCosechada, perdidas);
    }
    
    return result;
  } catch (e) {
    return { success: false, message: "Error: " + e.message };
  }
}

/**
 * Helper: Update Ciclos_Cultivo with production data
 */
function _updateCicloCultivoProduccion_(idCiclo, cantidadCosechada, perdidas) {
  try {
    const ss = SpreadsheetApp.getActive();
    const sheet = ss.getSheetByName("Ciclos_Cultivo");
    if (!sheet) return;
    
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return;
    
    const headers = data[0];
    const idIdx = headers.indexOf("ID");
    const estadoIdx = headers.indexOf("Estado");
    const cantidadProducidaIdx = headers.indexOf("Cantidad_Producida");
    const perdidasIdx = headers.indexOf("Perdidas");
    
    if (idIdx === -1) return;
    
    // Find and update matching row
    for (let i = 1; i < data.length; i++) {
      if (data[i][idIdx] === idCiclo) {
        // Update Estado to "Producido"
        if (estadoIdx !== -1) {
          sheet.getRange(i + 1, estadoIdx + 1).setValue("Producido");
        }
        
        // Accumulate Cantidad_Producida
        if (cantidadProducidaIdx !== -1) {
          const currentProducida = Number(data[i][cantidadProducidaIdx]) || 0;
          sheet.getRange(i + 1, cantidadProducidaIdx + 1).setValue(currentProducida + cantidadCosechada);
        }
        
        // Accumulate Perdidas
        if (perdidasIdx !== -1) {
          const currentPerdidas = Number(data[i][perdidasIdx]) || 0;
          sheet.getRange(i + 1, perdidasIdx + 1).setValue(currentPerdidas + perdidas);
        }
        
        break;
      }
    }
  } catch (e) {
    Logger.log("Error updating Ciclos_Cultivo: " + e.message);
  }
}

// ==============================
// DASHBOARD STATS
// ==============================

/**
 * Get dashboard summary statistics
 */
function getDashboardStats(token) {
  try {
    _authRequire_(token);
    const ss = SpreadsheetApp.getActive();
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    
    // End of this week (Sunday)
    const endOfThisWeek = new Date(now);
    endOfThisWeek.setDate(now.getDate() + (7 - now.getDay()));
    endOfThisWeek.setHours(23, 59, 59, 999);
    
    // Count active crops
    let cultivosActivos = 0;
    const cultivosSheet = ss.getSheetByName("Cultivos");
    if (cultivosSheet) {
      const lastRow = cultivosSheet.getLastRow();
      if (lastRow > 1) {
        const headers = cultivosSheet.getRange(1, 1, 1, cultivosSheet.getLastColumn()).getValues()[0];
        const estadoIdx = headers.indexOf("Estado");
        if (estadoIdx !== -1) {
          const data = cultivosSheet.getRange(2, estadoIdx + 1, lastRow - 1, 1).getValues();
          cultivosActivos = data.filter(r => {
            const e = String(r[0] || "").toLowerCase();
            return e !== "finalizado" && e !== "cancelado" && e !== "";
          }).length;
        }
      }
    }
    
    // Sum total costs this month
    let costosMes = 0;
    const costosSheet = ss.getSheetByName("Costos");
    if (costosSheet) {
      const lastRow = costosSheet.getLastRow();
      if (lastRow > 1) {
        const headers = costosSheet.getRange(1, 1, 1, costosSheet.getLastColumn()).getValues()[0];
        const fechaIdx = headers.indexOf("Fecha");
        const costoTotalIdx = headers.indexOf("Costo_Total");
        
        if (fechaIdx !== -1 && costoTotalIdx !== -1) {
          const data = costosSheet.getRange(2, 1, lastRow - 1, costosSheet.getLastColumn()).getValues();
          
          data.forEach(row => {
            const fecha = row[fechaIdx];
            if (fecha instanceof Date && fecha >= firstDayOfMonth && fecha <= lastDayOfMonth) {
              costosMes += Number(row[costoTotalIdx]) || 0;
            }
          });
        }
      }
    }
    
    // Count pending activities (Estado=Pendiente AND Fecha_Planeada <= end of this week)
    let actividadesPendientes = 0;
    const actividadesSheet = ss.getSheetByName("Actividades_Cultivo");
    if (actividadesSheet) {
      const lastRow = actividadesSheet.getLastRow();
      if (lastRow > 1) {
        const headers = actividadesSheet.getRange(1, 1, 1, actividadesSheet.getLastColumn()).getValues()[0];
        const estadoIdx = headers.indexOf("Estado");
        const fechaPlaneadaIdx = headers.indexOf("Fecha_Planeada");
        
        if (estadoIdx !== -1) {
          const data = actividadesSheet.getRange(2, 1, lastRow - 1, actividadesSheet.getLastColumn()).getValues();
          actividadesPendientes = data.filter(r => {
            const e = String(r[estadoIdx] || "").toLowerCase();
            const fechaPlaneada = r[fechaPlaneadaIdx];
            
            // Pendiente or empty estado
            const isPending = e === "pendiente" || e === "";
            
            // No date restriction if fechaPlaneadaIdx not found, or date is <= end of this week
            let isThisWeekOrOlder = true;
            if (fechaPlaneadaIdx !== -1 && fechaPlaneada instanceof Date) {
              isThisWeekOrOlder = fechaPlaneada <= endOfThisWeek;
            }
            
            return isPending && isThisWeekOrOlder;
          }).length;
        }
      }
    }
    
    // Sum ingresos (income) from Produccion this month
    let ingresosMes = 0;
    const produccionSheet = ss.getSheetByName("Produccion");
    if (produccionSheet) {
      const lastRow = produccionSheet.getLastRow();
      if (lastRow > 1) {
        const headers = produccionSheet.getRange(1, 1, 1, produccionSheet.getLastColumn()).getValues()[0];
        const fechaIdx = headers.indexOf("Fecha");
        const costoTotalIdx = headers.indexOf("Costo_Total");
        
        if (fechaIdx !== -1 && costoTotalIdx !== -1) {
          const data = produccionSheet.getRange(2, 1, lastRow - 1, produccionSheet.getLastColumn()).getValues();
          
          data.forEach(row => {
            const fecha = row[fechaIdx];
            if (fecha instanceof Date && fecha >= firstDayOfMonth && fecha <= lastDayOfMonth) {
              ingresosMes += Number(row[costoTotalIdx]) || 0;
            }
          });
        }
      }
    }
    
    // Sum unidades producidas this month
    let unidadesProducidas = 0;
    if (produccionSheet) {
      const lastRow = produccionSheet.getLastRow();
      if (lastRow > 1) {
        const headers = produccionSheet.getRange(1, 1, 1, produccionSheet.getLastColumn()).getValues()[0];
        const fechaIdx = headers.indexOf("Fecha");
        const cantidadIdx = headers.indexOf("Cantidad_Cosechada");
        
        if (fechaIdx !== -1 && cantidadIdx !== -1) {
          const data = produccionSheet.getRange(2, 1, lastRow - 1, produccionSheet.getLastColumn()).getValues();
          
          data.forEach(row => {
            const fecha = row[fechaIdx];
            if (fecha instanceof Date && fecha >= firstDayOfMonth && fecha <= lastDayOfMonth) {
              unidadesProducidas += Number(row[cantidadIdx]) || 0;
            }
          });
        }
      }
    }

    return {
      cultivosActivos,
      costosMes,
      actividadesPendientes,
      ingresosMes,
      unidadesProducidas,
      tasaCambio: getTasaCambio(),
      jornalDia: getJornalDia(),
      lastUpdate: new Date().toLocaleString('es-CO', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      })
    };
  } catch (error) {
    return {
      cultivosActivos: 0,
      costosMes: 0,
      actividadesPendientes: 0,
      ingresosMes: 0,
      unidadesProducidas: 0,
      tasaCambio: 0,
      jornalDia: 0,
      lastUpdate: 'Error'
    };
  }
}

/**
 * Get monthly financial data for charts (last 6 months)
 * Returns costs by Tipo_Costo and income from Produccion
 */
function getMonthlyFinancialData(token) {
  try {
    _authRequire_(token);
    const ss = SpreadsheetApp.getActive();
    const now = new Date();
    
    // Get last 6 months
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        year: date.getFullYear(),
        month: date.getMonth(),
        label: date.toLocaleDateString('es-CO', { year: 'numeric', month: 'short' })
      });
    }
    
    // Initialize data structure
    const monthlyData = {};
    months.forEach(m => {
      const key = `${m.year}-${m.month}`;
      monthlyData[key] = {
        label: m.label,
        costos: {
          INSUMO: 0,
          MANO_OBRA: 0,
          ARRENDAMIENTO: 0,
          SERVICIO: 0,
          OTRO: 0
        },
        ingresos: 0
      };
    });
    
    // Get costs data
    const costosSheet = ss.getSheetByName("Costos");
    if (costosSheet && costosSheet.getLastRow() > 1) {
      const headers = costosSheet.getRange(1, 1, 1, costosSheet.getLastColumn()).getValues()[0];
      const fechaIdx = headers.indexOf("Fecha");
      const tipoIdx = headers.indexOf("Tipo_Costo");
      const costoTotalIdx = headers.indexOf("Costo_Total");
      
      if (fechaIdx !== -1 && tipoIdx !== -1 && costoTotalIdx !== -1) {
        const data = costosSheet.getRange(2, 1, costosSheet.getLastRow() - 1, costosSheet.getLastColumn()).getValues();
        
        data.forEach(row => {
          const fecha = row[fechaIdx];
          if (fecha instanceof Date) {
            const key = `${fecha.getFullYear()}-${fecha.getMonth()}`;
            if (monthlyData[key]) {
              const tipo = String(row[tipoIdx] || "OTRO");
              const costo = Number(row[costoTotalIdx]) || 0;
              if (monthlyData[key].costos[tipo] !== undefined) {
                monthlyData[key].costos[tipo] += costo;
              } else {
                monthlyData[key].costos.OTRO += costo;
              }
            }
          }
        });
      }
    }
    
    // Get income from Produccion
    const produccionSheet = ss.getSheetByName("Produccion");
    if (produccionSheet && produccionSheet.getLastRow() > 1) {
      const headers = produccionSheet.getRange(1, 1, 1, produccionSheet.getLastColumn()).getValues()[0];
      const fechaIdx = headers.indexOf("Fecha");
      const costoTotalIdx = headers.indexOf("Costo_Total");
      
      if (fechaIdx !== -1 && costoTotalIdx !== -1) {
        const data = produccionSheet.getRange(2, 1, produccionSheet.getLastRow() - 1, produccionSheet.getLastColumn()).getValues();
        
        data.forEach(row => {
          const fecha = row[fechaIdx];
          if (fecha instanceof Date) {
            const key = `${fecha.getFullYear()}-${fecha.getMonth()}`;
            if (monthlyData[key]) {
              monthlyData[key].ingresos += Number(row[costoTotalIdx]) || 0;
            }
          }
        });
      }
    }
    
    // Convert to array
    const result = months.map(m => {
      const key = `${m.year}-${m.month}`;
      return monthlyData[key];
    });
    
    return { success: true, data: result };
  } catch (error) {
    return { success: false, message: "Error: " + error.message };
  }
}

// ==============================
// PLACEHOLDER DIALOGS
// ==============================

function showNewCultivoDialog() {
  const ui = SpreadsheetApp.getUi();
  ui.alert("Nuevo Cultivo", "Esta función abrirá el formulario de nuevo cultivo.\n\nPor ahora, agregue datos directamente en la hoja 'Cultivos'.", ui.ButtonSet.OK);
}

function showActiveCultivos() {
  const ui = SpreadsheetApp.getUi();
  const sheet = SpreadsheetApp.getActive().getSheetByName("Cultivos");
  if (sheet) {
    SpreadsheetApp.getActive().setActiveSheet(sheet);
  }
  ui.alert("Cultivos Activos", "Revise la hoja 'Cultivos' para ver todos los cultivos.\nFiltre por la columna 'Estado' para ver solo los activos.", ui.ButtonSet.OK);
}

function showNewCostoDialog() {
  const ui = SpreadsheetApp.getUi();
  ui.alert("Registrar Costo", "Esta función abrirá el formulario de registro de costos.\n\nPor ahora, agregue datos directamente en la hoja 'Costos'.", ui.ButtonSet.OK);
}

function showCostsSummary() {
  const ui = SpreadsheetApp.getUi();
  const sheet = SpreadsheetApp.getActive().getSheetByName("Costos");
  if (sheet) {
    SpreadsheetApp.getActive().setActiveSheet(sheet);
  }
  ui.alert("Resumen de Costos", "Revise la hoja 'Costos' para ver todos los gastos registrados.", ui.ButtonSet.OK);
}

function showGeneralSummary() {
  const ui = SpreadsheetApp.getUi();
  const stats = getDashboardStats(""); // Skip auth for menu call
  ui.alert("Resumen General", 
    `🌾 FARM MANAGER - RESUMEN\n\n` +
    `Cultivos Activos: ${stats.cultivosActivos}\n` +
    `Costos del Mes: $${stats.costosMes.toLocaleString()}\n` +
    `Actividades Pendientes: ${stats.actividadesPendientes}\n` +
    `Insumos con Stock Bajo: ${stats.insumosAlerta}\n\n` +
    `Tasa de Cambio: $${stats.tasaCambio}\n` +
    `Jornal Día: $${stats.jornalDia.toLocaleString()}\n\n` +
    `Última actualización: ${stats.lastUpdate}`,
    ui.ButtonSet.OK
  );
}

function showCostsByCultivo() {
  const ui = SpreadsheetApp.getUi();
  ui.alert("Costos por Cultivo", "Esta función mostrará un resumen de costos por cada cultivo.\n\nPróximamente disponible.", ui.ButtonSet.OK);
}

// ==============================
// PRODUCTION CYCLES AUTOMATION
// ==============================

/**
 * Generate production cycles for a variety
 * Called from the frontend after saving a Variedad
 */
function generarCiclosProduccion(token, variedadId) {
  _authRequire_(token);
  
  try {
    const ss = SpreadsheetApp.getActive();
    const variedadesSheet = ss.getSheetByName("Variedades");
    const ciclosSheet = ss.getSheetByName("Ciclo_Produccion");
    
    if (!variedadesSheet || !ciclosSheet) {
      return { success: false, message: "Hojas no encontradas" };
    }
    
    // Find the variety
    const variedadesData = variedadesSheet.getDataRange().getValues();
    const variedadesHeaders = variedadesData[0];
    const idIdx = variedadesHeaders.indexOf("ID");
    const cicloSemanasIdx = variedadesHeaders.indexOf("Ciclo_en_Semanas");
    const semanaInicioIdx = variedadesHeaders.indexOf("Semana_Inicio_Corte");
    
    let variedadRow = null;
    for (let i = 1; i < variedadesData.length; i++) {
      if (variedadesData[i][idIdx] === variedadId) {
        variedadRow = variedadesData[i];
        break;
      }
    }
    
    if (!variedadRow) {
      return { success: false, message: "Variedad no encontrada" };
    }
    
    const cicloSemanas = Number(variedadRow[cicloSemanasIdx]) || 0;
    const semanaInicio = Number(variedadRow[semanaInicioIdx]) || 0;
    
    if (cicloSemanas <= 0 || semanaInicio <= 0) {
      return { success: false, message: "Debe especificar Ciclo en Semanas y Semana Inicio Corte" };
    }
    
    if (semanaInicio >= cicloSemanas) {
      return { success: false, message: "Semana Inicio Corte debe ser menor que Ciclo en Semanas" };
    }
    
    // Delete existing cycles for this variety
    const ciclosData = ciclosSheet.getDataRange().getValues();
    const ciclosHeaders = ciclosData[0];
    const cicloIdVarIdx = ciclosHeaders.indexOf("ID_Variedad");
    
    for (let i = ciclosData.length - 1; i >= 1; i--) {
      if (ciclosData[i][cicloIdVarIdx] === variedadId) {
        ciclosSheet.deleteRow(i + 1);
      }
    }
    
    // Calculate production weeks
    const semanasProduccion = cicloSemanas - semanaInicio;
    const numCortes = semanasProduccion;
    
    // Calculate percentage distribution (bell curve-like)
    const percentages = calcularDistribucionProduccion(numCortes);
    
    // Insert new cycles
    const newRows = [];
    for (let i = 0; i < numCortes; i++) {
      const nroSemana = semanaInicio + i + 1;
      const corteNum = i + 1;
      
      newRows.push([
        Utilities.getUuid(),                    // ID
        variedadId,                             // ID_Variedad
        `Corte ${corteNum}`,                    // Nombre_Ciclo
        nroSemana,                              // Nro_Semana
        percentages[i],                         // Porcentaje_Produccion
        `Semana ${nroSemana} del ciclo`,       // Descripcion
        ""                                      // Actividades_Semana
      ]);
    }
    
    if (newRows.length > 0) {
      ciclosSheet.getRange(ciclosSheet.getLastRow() + 1, 1, newRows.length, newRows[0].length)
        .setValues(newRows);
    }
    
    // Mark variety as having cycles
    const tieneCiclosIdx = variedadesHeaders.indexOf("Tiene_Ciclos_Produccion");
    if (tieneCiclosIdx >= 0) {
      for (let i = 1; i < variedadesData.length; i++) {
        if (variedadesData[i][idIdx] === variedadId) {
          variedadesSheet.getRange(i + 1, tieneCiclosIdx + 1).setValue("Sí");
          break;
        }
      }
    }
    
    return { 
      success: true, 
      message: `${numCortes} ciclos de producción generados`,
      ciclosGenerados: numCortes
    };
    
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

/**
 * Calculate production distribution across weeks
 * Uses a bell curve-like distribution
 */
function calcularDistribucionProduccion(numCortes) {
  if (numCortes <= 0) return [];
  if (numCortes === 1) return [100];
  
  // Simple distribution: peak in the middle, lower at edges
  const percentages = [];
  let total = 0;
  
  // Generate raw values using a triangular/bell-like distribution
  for (let i = 0; i < numCortes; i++) {
    const position = i / (numCortes - 1); // 0 to 1
    const center = 0.5;
    const distance = Math.abs(position - center);
    
    // Higher value at center, lower at edges
    const rawValue = 1 - (distance * 1.5);
    const value = Math.max(0.3, rawValue); // Minimum 30% of max
    
    percentages.push(value);
    total += value;
  }
  
  // Normalize to 100%
  const normalized = percentages.map(v => {
    const pct = (v / total) * 100;
    return Math.round(pct * 10) / 10; // Round to 1 decimal
  });
  
  // Adjust last value to ensure sum is exactly 100%
  const sum = normalized.reduce((a, b) => a + b, 0);
  normalized[normalized.length - 1] += (100 - sum);
  
  return normalized;
}

// ==============================
// CULTIVO GENERATION FUNCTIONS
// ==============================

/**
 * Generate production cycles for a specific cultivo instance
 * Based on the variety's Ciclo_Produccion templates
 */
function generarCiclosCultivo(token, cultivoId) {
  _authRequire_(token);
  
  try {
    const ss = SpreadsheetApp.getActive();
    const cultivosSheet = ss.getSheetByName("Cultivos");
    const variedadesSheet = ss.getSheetByName("Variedades");
    const cicloTemplateSheet = ss.getSheetByName("Ciclo_Produccion");
    const ciclosCultivoSheet = ss.getSheetByName("Ciclos_Cultivo");
    
    if (!cultivosSheet || !variedadesSheet || !cicloTemplateSheet || !ciclosCultivoSheet) {
      return { success: false, message: "Hojas requeridas no encontradas" };
    }
    
    // Find the cultivo
    const cultivosData = cultivosSheet.getDataRange().getValues();
    const cultivosHeaders = cultivosData[0];
    const cultivoIdIdx = cultivosHeaders.indexOf("ID");
    const cultivoVariedadIdx = cultivosHeaders.indexOf("ID_Variedad");
    const cultivoFechaInicioIdx = cultivosHeaders.indexOf("Fecha_Inicio");
    const cultivoTotalPlantasIdx = cultivosHeaders.indexOf("Total_Plantas");
    
    let cultivoRow = null;
    for (let i = 1; i < cultivosData.length; i++) {
      if (cultivosData[i][cultivoIdIdx] === cultivoId) {
        cultivoRow = cultivosData[i];
        break;
      }
    }
    
    if (!cultivoRow) {
      return { success: false, message: "Cultivo no encontrado" };
    }
    
    const variedadId = cultivoRow[cultivoVariedadIdx];
    const fechaInicio = cultivoRow[cultivoFechaInicioIdx];
    const totalPlantas = Number(cultivoRow[cultivoTotalPlantasIdx]) || 0;
    
    if (!variedadId) {
      return { success: false, message: "El cultivo no tiene una variedad asignada" };
    }
    
    if (!fechaInicio) {
      return { success: false, message: "El cultivo no tiene fecha de inicio" };
    }
    
    // Find the variedad for Rendimiento
    const variedadesData = variedadesSheet.getDataRange().getValues();
    const variedadesHeaders = variedadesData[0];
    const varIdIdx = variedadesHeaders.indexOf("ID");
    const rendimientoIdx = variedadesHeaders.indexOf("Rendimiento_Esperado_por_Planta");
    
    let rendimientoPlanta = 0;
    for (let i = 1; i < variedadesData.length; i++) {
      if (variedadesData[i][varIdIdx] === variedadId) {
        rendimientoPlanta = Number(variedadesData[i][rendimientoIdx]) || 0;
        break;
      }
    }
    
    // Get Ciclo_Produccion templates for this variety
    const templateData = cicloTemplateSheet.getDataRange().getValues();
    const templateHeaders = templateData[0];
    const tplIdVarIdx = templateHeaders.indexOf("ID_Variedad");
    const tplNombreIdx = templateHeaders.indexOf("Nombre_Ciclo");
    const tplNroSemanaIdx = templateHeaders.indexOf("Nro_Semana");
    const tplPorcentajeIdx = templateHeaders.indexOf("Porcentaje_Produccion");
    
    const templates = [];
    for (let i = 1; i < templateData.length; i++) {
      if (templateData[i][tplIdVarIdx] === variedadId) {
        templates.push({
          nombreCiclo: templateData[i][tplNombreIdx],
          nroSemana: Number(templateData[i][tplNroSemanaIdx]) || 0,
          porcentaje: Number(templateData[i][tplPorcentajeIdx]) || 0
        });
      }
    }
    
    if (templates.length === 0) {
      return { success: false, message: "La variedad no tiene ciclos de producción definidos. Genere ciclos en Variedades primero." };
    }
    
    // Sort templates by week number
    templates.sort((a, b) => a.nroSemana - b.nroSemana);
    
    // Delete existing Ciclos_Cultivo for this cultivo
    const ciclosCultivoData = ciclosCultivoSheet.getDataRange().getValues();
    const ciclosCultivoHeaders = ciclosCultivoData[0];
    const ccIdCultivoIdx = ciclosCultivoHeaders.indexOf("ID_Cultivo");
    
    for (let i = ciclosCultivoData.length - 1; i >= 1; i--) {
      if (ciclosCultivoData[i][ccIdCultivoIdx] === cultivoId) {
        ciclosCultivoSheet.deleteRow(i + 1);
      }
    }
    
    // Calculate base date
    const baseDate = new Date(fechaInicio);
    
    // Generate new rows
    const newRows = [];
    for (let i = 0; i < templates.length; i++) {
      const tpl = templates[i];
      
      // Calculate Fecha_Planeada
      const fechaPlaneada = new Date(baseDate);
      fechaPlaneada.setDate(fechaPlaneada.getDate() + (tpl.nroSemana * 7));
      const fechaPlaneadaStr = Utilities.formatDate(fechaPlaneada, Session.getScriptTimeZone(), "yyyy-MM-dd");
      
      // Calculate Cantidad_Planeada = Rendimiento * Total_Plantas * Porcentaje / 100
      const cantidadPlaneada = Math.round((rendimientoPlanta * totalPlantas * tpl.porcentaje / 100) * 100) / 100;
      
      newRows.push([
        Utilities.getUuid(),           // ID
        i + 1,                          // Consecutivo
        cultivoId,                      // ID_Cultivo
        tpl.nombreCiclo,               // Ciclo_Produccion
        tpl.nroSemana,                 // Nro_Semana
        fechaPlaneadaStr,              // Fecha_Planeada
        rendimientoPlanta,             // Tasa_Produccion
        cantidadPlaneada,              // Cantidad_Planeada
        "",                            // Fecha_Efectiva
        0,                             // Perdidas
        0,                             // Cantidad_Producida
        "Planeado",                    // Estado
        ""                             // Observaciones
      ]);
    }
    
    if (newRows.length > 0) {
      ciclosCultivoSheet.getRange(ciclosCultivoSheet.getLastRow() + 1, 1, newRows.length, newRows[0].length)
        .setValues(newRows);
    }
    
    return {
      success: true,
      message: `${newRows.length} ciclos generados`,
      ciclosGenerados: newRows.length
    };
    
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

/**
 * Generate activities for a specific cultivo instance
 * Based on the variety's Actividades templates
 */
function generarActividadesCultivo(token, cultivoId, sourceType) {
  _authRequire_(token);
  
  try {
    const ss = SpreadsheetApp.getActive();
    const cultivosSheet = ss.getSheetByName("Cultivos");
    const actividadesSheet = ss.getSheetByName("Actividades");
    const actCultivoSheet = ss.getSheetByName("Actividades_Cultivo");
    
    if (!cultivosSheet || !actividadesSheet || !actCultivoSheet) {
      return { success: false, message: "Hojas requeridas no encontradas" };
    }
    
    // Find the cultivo
    const cultivosData = cultivosSheet.getDataRange().getValues();
    const cultivosHeaders = cultivosData[0];
    const cultivoIdIdx = cultivosHeaders.indexOf("ID");
    const cultivoVariedadIdx = cultivosHeaders.indexOf("ID_Variedad");
    const cultivoFechaInicioIdx = cultivosHeaders.indexOf("Fecha_Inicio");
    const cultivoTotalPlantasIdx = cultivosHeaders.indexOf("Total_Plantas");
    
    let cultivoRow = null;
    for (let i = 1; i < cultivosData.length; i++) {
      if (cultivosData[i][cultivoIdIdx] === cultivoId) {
        cultivoRow = cultivosData[i];
        break;
      }
    }
    
    if (!cultivoRow) {
      return { success: false, message: "Cultivo no encontrado" };
    }
    
    const variedadId = cultivoRow[cultivoVariedadIdx];
    const fechaInicio = cultivoRow[cultivoFechaInicioIdx];
    const totalPlantas = Number(cultivoRow[cultivoTotalPlantasIdx]) || 0;
    
    if (!variedadId) {
      return { success: false, message: "El cultivo no tiene una variedad asignada" };
    }
    
    if (!fechaInicio) {
      return { success: false, message: "El cultivo no tiene fecha de inicio" };
    }
    
    // Get source info
    const sourcesInfo = getActividadesSources(token, cultivoId);
    if (!sourcesInfo.success) {
      return sourcesInfo;
    }
    
    // Determine filter field and value based on sourceType
    let filterField, filterValue, sourceName;
    
    if (sourceType === 'Variedad') {
      if (!sourcesInfo.hasVariedadActivities) {
        return { success: false, message: `La variedad "${sourcesInfo.variedadNombre}" no tiene actividades definidas.` };
      }
      filterField = 'ID_Variedad';
      filterValue = sourcesInfo.variedadId;
      sourceName = `Variedad: ${sourcesInfo.variedadNombre}`;
    } else if (sourceType === 'Clase_Cultivo') {
      if (!sourcesInfo.hasClaseActivities) {
        return { success: false, message: `La clase de cultivo "${sourcesInfo.claseNombre}" no tiene actividades definidas.` };
      }
      filterField = 'ID_Clase_Cultivo';
      filterValue = sourcesInfo.claseId;
      sourceName = `Clase: ${sourcesInfo.claseNombre}`;
    } else {
      return { success: false, message: "Tipo de fuente inválido. Use 'Variedad' o 'Clase_Cultivo'." };
    }
    
    // Get Actividades templates for selected source
    const actividadesData = actividadesSheet.getDataRange().getValues();
    const actividadesHeaders = actividadesData[0];
    const actIdIdx = actividadesHeaders.indexOf("ID");
    const actFilterIdx = actividadesHeaders.indexOf(filterField);
    const actNombreIdx = actividadesHeaders.indexOf("Nombre_Actividad");
    const actSemanaIdx = actividadesHeaders.indexOf("Semana_Actividad");
    const actTiempoIdx = actividadesHeaders.indexOf("Tiempo_Por_Planta_Seg");
    
    // Determine opposite field to ensure it's empty
    const oppositeField = filterField === 'ID_Variedad' ? 'ID_Clase_Cultivo' : 'ID_Variedad';
    const oppositeIdx = actividadesHeaders.indexOf(oppositeField);
    
    const templates = [];
    for (let i = 1; i < actividadesData.length; i++) {
      // Check if this row matches our filter AND the opposite field is empty
      if (actividadesData[i][actFilterIdx] === filterValue && !actividadesData[i][oppositeIdx]) {
        templates.push({
          id: actividadesData[i][actIdIdx],
          nombre: actividadesData[i][actNombreIdx],
          semana: Number(actividadesData[i][actSemanaIdx]) || 0,
          tiempoPorPlanta: Number(actividadesData[i][actTiempoIdx]) || 0
        });
      }
    }
    
    if (templates.length === 0) {
      return { success: false, message: `No se encontraron actividades para ${sourceName}. Agregue actividades en Configuración > Actividades primero.` };
    }
    
    // Sort templates by week number
    templates.sort((a, b) => a.semana - b.semana);
    
    // Delete existing Actividades_Cultivo for this cultivo
    const actCultivoData = actCultivoSheet.getDataRange().getValues();
    const actCultivoHeaders = actCultivoData[0];
    const acIdCultivoIdx = actCultivoHeaders.indexOf("ID_Cultivo");
    
    for (let i = actCultivoData.length - 1; i >= 1; i--) {
      if (actCultivoData[i][acIdCultivoIdx] === cultivoId) {
        actCultivoSheet.deleteRow(i + 1);
      }
    }
    
    // Calculate base date
    const baseDate = new Date(fechaInicio);
    
    // Generate new rows
    const newRows = [];
    for (let i = 0; i < templates.length; i++) {
      const tpl = templates[i];
      
      // Calculate Fecha_Planeada
      const fechaPlaneada = new Date(baseDate);
      fechaPlaneada.setDate(fechaPlaneada.getDate() + (tpl.semana * 7));
      const fechaPlaneadaStr = Utilities.formatDate(fechaPlaneada, Session.getScriptTimeZone(), "yyyy-MM-dd");
      
      // Calculate Tiempo_Requerido_Min = (Tiempo_Por_Planta_Seg * Total_Plantas) / 60
      const tiempoRequerido = Math.round((tpl.tiempoPorPlanta * totalPlantas / 60) * 100) / 100;
      
      newRows.push([
        Utilities.getUuid(),           // ID
        i + 1,                          // Consecutivo
        cultivoId,                      // ID_Cultivo
        tpl.id,                         // ID_Actividad
        tpl.nombre,                    // Nombre_Actividad
        tpl.semana,                    // Nro_Semana
        fechaPlaneadaStr,              // Fecha_Planeada
        tiempoRequerido,               // Tiempo_Requerido_Min
        0,                             // Tiempo_Efectivo_Min
        "",                            // Responsable
        "Pendiente",                   // Estado
        ""                             // Observaciones
      ]);
    }
    
    if (newRows.length > 0) {
      actCultivoSheet.getRange(actCultivoSheet.getLastRow() + 1, 1, newRows.length, newRows[0].length)
        .setValues(newRows);
    }
    
    return {
      success: true,
      message: `${newRows.length} actividades generadas desde ${sourceName}`,
      actividadesGeneradas: newRows.length,
      source: sourceName
    };
    
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

/**
 * Generate material requirements (insumos) for a specific cultivo instance
 * Based on the variety's Actividades templates and their Insumos_JSON
 */
function generarInsumosCultivo(token, cultivoId, sourceType) {
  _authRequire_(token);
  
  try {
    const ss = SpreadsheetApp.getActive();
    const cultivosSheet = ss.getSheetByName("Cultivos");
    const actividadesSheet = ss.getSheetByName("Actividades");
    const insumosSheet = ss.getSheetByName("Insumos");
    const insumosCultivoSheet = ss.getSheetByName("Insumos_Cultivo");
    
    if (!cultivosSheet || !actividadesSheet || !insumosCultivoSheet) {
      return { success: false, message: "Hojas requeridas no encontradas" };
    }
    
    // Find the cultivo
    const cultivosData = cultivosSheet.getDataRange().getValues();
    const cultivosHeaders = cultivosData[0];
    const cultivoIdIdx = cultivosHeaders.indexOf("ID");
    const cultivoVariedadIdx = cultivosHeaders.indexOf("ID_Variedad");
    const cultivoFechaInicioIdx = cultivosHeaders.indexOf("Fecha_Inicio");
    const cultivoTotalPlantasIdx = cultivosHeaders.indexOf("Total_Plantas");
    
    let cultivoRow = null;
    for (let i = 1; i < cultivosData.length; i++) {
      if (cultivosData[i][cultivoIdIdx] === cultivoId) {
        cultivoRow = cultivosData[i];
        break;
      }
    }
    
    if (!cultivoRow) {
      return { success: false, message: "Cultivo no encontrado" };
    }
    
    const variedadId = cultivoRow[cultivoVariedadIdx];
    const fechaInicio = cultivoRow[cultivoFechaInicioIdx];
    const totalPlantas = Number(cultivoRow[cultivoTotalPlantasIdx]) || 0;
    
    if (!variedadId) {
      return { success: false, message: "El cultivo no tiene una variedad asignada" };
    }
    
    if (!fechaInicio) {
      return { success: false, message: "El cultivo no tiene fecha de inicio" };
    }
    
    // Get source info
    const sourcesInfo = getActividadesSources(token, cultivoId);
    if (!sourcesInfo.success) {
      return sourcesInfo;
    }
    
    // Determine filter field and value based on sourceType
    let filterField, filterValue, sourceName;
    
    if (sourceType === 'Variedad') {
      if (!sourcesInfo.hasVariedadActivities) {
        return { success: false, message: `La variedad "${sourcesInfo.variedadNombre}" no tiene actividades con insumos definidos.` };
      }
      filterField = 'ID_Variedad';
      filterValue = sourcesInfo.variedadId;
      sourceName = `Variedad: ${sourcesInfo.variedadNombre}`;
    } else if (sourceType === 'Clase_Cultivo') {
      if (!sourcesInfo.hasClaseActivities) {
        return { success: false, message: `La clase de cultivo "${sourcesInfo.claseNombre}" no tiene actividades con insumos definidos.` };
      }
      filterField = 'ID_Clase_Cultivo';
      filterValue = sourcesInfo.claseId;
      sourceName = `Clase: ${sourcesInfo.claseNombre}`;
    } else {
      return { success: false, message: "Tipo de fuente inválido. Use 'Variedad' o 'Clase_Cultivo'." };
    }
    
    // Build Insumos lookup map for Valor_Unitario
    const insumosMap = {};
    if (insumosSheet) {
      const insumosData = insumosSheet.getDataRange().getValues();
      const insumosHeaders = insumosData[0];
      const insIdIdx = insumosHeaders.indexOf("ID");
      const insValorIdx = insumosHeaders.indexOf("Valor_Unitario");
      
      for (let i = 1; i < insumosData.length; i++) {
        const id = insumosData[i][insIdIdx];
        if (id) {
          insumosMap[id] = Number(insumosData[i][insValorIdx]) || 0;
        }
      }
    }
    
    // Get Actividades templates for selected source with Insumos_JSON
    const actividadesData = actividadesSheet.getDataRange().getValues();
    const actividadesHeaders = actividadesData[0];
    const actFilterIdx = actividadesHeaders.indexOf(filterField);
    const actSemanaIdx = actividadesHeaders.indexOf("Semana_Actividad");
    const actInsumosJsonIdx = actividadesHeaders.indexOf("Insumos_JSON");
    
    // Determine opposite field to ensure it's empty
    const oppositeField = filterField === 'ID_Variedad' ? 'ID_Clase_Cultivo' : 'ID_Variedad';
    const oppositeIdx = actividadesHeaders.indexOf(oppositeField);
    
    const insumosToGenerate = [];
    
    for (let i = 1; i < actividadesData.length; i++) {
      // Check if this row matches our filter AND the opposite field is empty
      if (actividadesData[i][actFilterIdx] !== filterValue || actividadesData[i][oppositeIdx]) continue;
      
      const semana = Number(actividadesData[i][actSemanaIdx]) || 0;
      const insumosJson = actividadesData[i][actInsumosJsonIdx];
      
      if (!insumosJson || insumosJson === '[]') continue;
      
      // Try to parse JSON
      let insumosArray = [];
      try {
        insumosArray = JSON.parse(insumosJson);
      } catch (e) {
        continue; // Skip invalid JSON
      }
      
      if (!Array.isArray(insumosArray) || insumosArray.length === 0) continue;
      
      // Get activity template ID and name for linking
      const actIdIdx = actividadesHeaders.indexOf("ID");
      const actNombreIdx = actividadesHeaders.indexOf("Nombre_Actividad");
      const actividadTemplateId = actividadesData[i][actIdIdx] || '';
      const actividadNombre = actividadesData[i][actNombreIdx] || '';
      
      for (const insumo of insumosArray) {
        insumosToGenerate.push({
          idInsumo: insumo.id || '',
          nombreInsumo: insumo.nombre || '',
          semana: semana,
          cantidadPorPlanta: Number(insumo.cantidad_por_planta) || 0,
          unidadMedida: insumo.unidad_medida_por_planta || '',
          actividadNombre: actividadNombre,
          actividadTemplateId: actividadTemplateId
        });
      }
    }
    
    if (insumosToGenerate.length === 0) {
      return { success: false, message: `Las actividades de ${sourceName} no tienen insumos definidos. Agregue insumos a las actividades primero.` };
    }
    
    // Build Actividades_Cultivo lookup map to link insumos to activities
    // Primary key: ID_Actividad (template ID) for exact matching
    // Secondary key: "semana_nombre" as fallback
    const actividadesCultivoSheet = ss.getSheetByName("Actividades_Cultivo");
    const actividadesByTemplateId = {}; // Key: ID_Actividad (template ID) -> Actividades_Cultivo.ID
    const actividadesBySemanaName = {}; // Key: "semana_nombre" -> Actividades_Cultivo.ID (fallback)
    
    if (actividadesCultivoSheet) {
      const acData = actividadesCultivoSheet.getDataRange().getValues();
      const acHeaders = acData[0];
      const acIdIdx = acHeaders.indexOf("ID");
      const acIdCultivoIdx = acHeaders.indexOf("ID_Cultivo");
      const acIdActividadIdx = acHeaders.indexOf("ID_Actividad"); // Link to template
      const acNombreIdx = acHeaders.indexOf("Nombre_Actividad");
      const acSemanaIdx = acHeaders.indexOf("Nro_Semana");
      
      for (let i = 1; i < acData.length; i++) {
        if (acData[i][acIdCultivoIdx] === cultivoId) {
          const actividadCultivoId = acData[i][acIdIdx];
          const templateId = acData[i][acIdActividadIdx] || '';
          const semana = Number(acData[i][acSemanaIdx]) || 0;
          const nombre = acData[i][acNombreIdx] || '';
          
          // Primary: by template ID
          if (templateId) {
            actividadesByTemplateId[templateId] = actividadCultivoId;
          }
          // Secondary: by semana_nombre
          const key = `${semana}_${nombre}`;
          actividadesBySemanaName[key] = actividadCultivoId;
        }
      }
    }
    
    // Delete existing Insumos_Cultivo for this cultivo
    const insumosCultivoData = insumosCultivoSheet.getDataRange().getValues();
    const insumosCultivoHeaders = insumosCultivoData[0];
    const icIdCultivoIdx = insumosCultivoHeaders.indexOf("ID_Cultivo");
    
    for (let i = insumosCultivoData.length - 1; i >= 1; i--) {
      if (insumosCultivoData[i][icIdCultivoIdx] === cultivoId) {
        insumosCultivoSheet.deleteRow(i + 1);
      }
    }
    
    // Calculate base date
    const baseDate = new Date(fechaInicio);
    
    // Generate new rows
    const newRows = [];
    for (let i = 0; i < insumosToGenerate.length; i++) {
      const ins = insumosToGenerate[i];
      
      // Calculate Fecha_Planeada
      const fechaPlaneada = new Date(baseDate);
      fechaPlaneada.setDate(fechaPlaneada.getDate() + (ins.semana * 7));
      const fechaPlaneadaStr = Utilities.formatDate(fechaPlaneada, Session.getScriptTimeZone(), "yyyy-MM-dd");
      
      // Calculate Cantidad_Requerida = cantidad_por_planta * Total_Plantas
      const cantidadRequerida = Math.round((ins.cantidadPorPlanta * totalPlantas) * 1000) / 1000;
      
      // Calculate Costo_Estimado = Cantidad_Requerida * Valor_Unitario
      const valorUnitario = insumosMap[ins.idInsumo] || 0;
      const costoEstimado = Math.round(cantidadRequerida * valorUnitario * 100) / 100;
      
      // Find linked Actividad_Cultivo
      // First try by template ID (most accurate), then fallback to semana_nombre
      let idActividadCultivo = '';
      if (ins.actividadTemplateId && actividadesByTemplateId[ins.actividadTemplateId]) {
        idActividadCultivo = actividadesByTemplateId[ins.actividadTemplateId];
      } else {
        // Fallback: try by semana + nombre
        const actividadKey = `${ins.semana}_${ins.actividadNombre}`;
        idActividadCultivo = actividadesBySemanaName[actividadKey] || '';
      }
      
      newRows.push([
        Utilities.getUuid(),           // ID
        i + 1,                          // Consecutivo
        cultivoId,                      // ID_Cultivo
        idActividadCultivo,            // ID_Actividad_Cultivo (linked!)
        ins.idInsumo,                  // ID_Insumo
        ins.nombreInsumo,              // Nombre_Insumo
        ins.semana,                    // Nro_Semana
        fechaPlaneadaStr,              // Fecha_Planeada
        cantidadRequerida,             // Cantidad_Requerida
        ins.unidadMedida,              // Unidad_Medida
        costoEstimado,                 // Costo_Estimado
        "Pendiente",                   // Estado
        ""                             // Observaciones
      ]);
    }
    
    if (newRows.length > 0) {
      insumosCultivoSheet.getRange(insumosCultivoSheet.getLastRow() + 1, 1, newRows.length, newRows[0].length)
        .setValues(newRows);
    }
    
    return {
      success: true,
      message: `${newRows.length} insumos generados desde ${sourceName}`,
      insumosGenerados: newRows.length,
      source: sourceName
    };
    
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

// ==============================
// CULTIVO STATUS & SOURCE CHECKING
// ==============================

/**
 * Check what has been generated for a specific cultivo
 * Returns object with boolean flags for ciclos, actividades, insumos
 */
function checkCultivoGenerationStatus(token, cultivoId) {
  _authRequire_(token);
  
  try {
    const ss = SpreadsheetApp.getActive();
    const ciclosSheet = ss.getSheetByName("Ciclos_Cultivo");
    const actividadesSheet = ss.getSheetByName("Actividades_Cultivo");
    const insumosSheet = ss.getSheetByName("Insumos_Cultivo");
    
    const result = {
      hasCiclos: false,
      hasActividades: false,
      hasInsumos: false,
      ciclosCount: 0,
      actividadesCount: 0,
      insumosCount: 0
    };
    
    // Check Ciclos_Cultivo
    if (ciclosSheet) {
      const data = ciclosSheet.getDataRange().getValues();
      const headers = data[0];
      const idCultivoIdx = headers.indexOf("ID_Cultivo");
      if (idCultivoIdx !== -1) {
        for (let i = 1; i < data.length; i++) {
          if (data[i][idCultivoIdx] === cultivoId) {
            result.ciclosCount++;
          }
        }
        result.hasCiclos = result.ciclosCount > 0;
      }
    }
    
    // Check Actividades_Cultivo
    if (actividadesSheet) {
      const data = actividadesSheet.getDataRange().getValues();
      const headers = data[0];
      const idCultivoIdx = headers.indexOf("ID_Cultivo");
      if (idCultivoIdx !== -1) {
        for (let i = 1; i < data.length; i++) {
          if (data[i][idCultivoIdx] === cultivoId) {
            result.actividadesCount++;
          }
        }
        result.hasActividades = result.actividadesCount > 0;
      }
    }
    
    // Check Insumos_Cultivo
    if (insumosSheet) {
      const data = insumosSheet.getDataRange().getValues();
      const headers = data[0];
      const idCultivoIdx = headers.indexOf("ID_Cultivo");
      if (idCultivoIdx !== -1) {
        for (let i = 1; i < data.length; i++) {
          if (data[i][idCultivoIdx] === cultivoId) {
            result.insumosCount++;
          }
        }
        result.hasInsumos = result.insumosCount > 0;
      }
    }
    
    return { success: true, ...result };
    
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

/**
 * Check available activity sources for a cultivo (Variedad or Clase_Cultivo)
 * Returns info about which sources have activities defined
 */
function getActividadesSources(token, cultivoId) {
  _authRequire_(token);
  
  try {
    const ss = SpreadsheetApp.getActive();
    const cultivosSheet = ss.getSheetByName("Cultivos");
    const variedadesSheet = ss.getSheetByName("Variedades");
    const clasesSheet = ss.getSheetByName("Clases_Cultivo");
    const actividadesSheet = ss.getSheetByName("Actividades");
    
    if (!cultivosSheet || !variedadesSheet || !actividadesSheet) {
      return { success: false, message: "Hojas requeridas no encontradas" };
    }
    
    // Get cultivo
    const cultivosData = cultivosSheet.getDataRange().getValues();
    const cultivosHeaders = cultivosData[0];
    const cultivoIdIdx = cultivosHeaders.indexOf("ID");
    const cultivoVariedadIdx = cultivosHeaders.indexOf("ID_Variedad");
    
    let cultivoRow = null;
    for (let i = 1; i < cultivosData.length; i++) {
      if (cultivosData[i][cultivoIdIdx] === cultivoId) {
        cultivoRow = cultivosData[i];
        break;
      }
    }
    
    if (!cultivoRow) {
      return { success: false, message: "Cultivo no encontrado" };
    }
    
    const variedadId = cultivoRow[cultivoVariedadIdx];
    if (!variedadId) {
      return { success: false, message: "Cultivo no tiene variedad asignada" };
    }
    
    // Get variedad info
    const variedadesData = variedadesSheet.getDataRange().getValues();
    const variedadesHeaders = variedadesData[0];
    const varIdIdx = variedadesHeaders.indexOf("ID");
    const varTipoCultivoIdx = variedadesHeaders.indexOf("Tipo_Cultivo");
    const varNombreIdx = variedadesHeaders.indexOf("Nombre");
    
    let variedadRow = null;
    for (let i = 1; i < variedadesData.length; i++) {
      if (variedadesData[i][varIdIdx] === variedadId) {
        variedadRow = variedadesData[i];
        break;
      }
    }
    
    if (!variedadRow) {
      return { success: false, message: "Variedad no encontrada" };
    }
    
    const tipoCultivo = variedadRow[varTipoCultivoIdx];
    const variedadNombre = variedadRow[varNombreIdx];
    
    // Find matching Clase_Cultivo
    let claseId = null;
    let claseNombre = null;
    if (clasesSheet && tipoCultivo) {
      const clasesData = clasesSheet.getDataRange().getValues();
      const clasesHeaders = clasesData[0];
      const claseIdIdx = clasesHeaders.indexOf("ID");
      const claseNombreIdx = clasesHeaders.indexOf("Nombre");
      
      for (let i = 1; i < clasesData.length; i++) {
        if (clasesData[i][claseNombreIdx] === tipoCultivo) {
          claseId = clasesData[i][claseIdIdx];
          claseNombre = clasesData[i][claseNombreIdx];
          break;
        }
      }
    }
    
    // Count activities by source
    const actividadesData = actividadesSheet.getDataRange().getValues();
    const actividadesHeaders = actividadesData[0];
    const actIdVarIdx = actividadesHeaders.indexOf("ID_Variedad");
    const actIdClaseIdx = actividadesHeaders.indexOf("ID_Clase_Cultivo");
    
    let countVariedad = 0;
    let countClase = 0;
    
    for (let i = 1; i < actividadesData.length; i++) {
      if (actividadesData[i][actIdVarIdx] === variedadId && !actividadesData[i][actIdClaseIdx]) {
        countVariedad++;
      }
      if (claseId && actividadesData[i][actIdClaseIdx] === claseId && !actividadesData[i][actIdVarIdx]) {
        countClase++;
      }
    }
    
    return {
      success: true,
      variedadId: variedadId,
      variedadNombre: variedadNombre,
      tipoCultivo: tipoCultivo,
      claseId: claseId,
      claseNombre: claseNombre,
      actividadesVariedad: countVariedad,
      actividadesClase: countClase,
      hasVariedadActivities: countVariedad > 0,
      hasClaseActivities: countClase > 0
    };
    
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

/**
 * Get production statistics for a cultivo (sum of Ciclos_Cultivo)
 * Returns Cantidad_Planeada and Cantidad_Producida totals with unit from Variedad
 */
function getCultivoProductionStats(token, cultivoId) {
  _authRequire_(token);
  
  try {
    const ss = SpreadsheetApp.getActive();
    
    // Get cultivo to find its variety
    const cultivosSheet = ss.getSheetByName("Cultivos");
    if (!cultivosSheet) {
      return { 
        success: true, 
        cantidadPlaneada: 0, 
        cantidadProducida: 0,
        unidad: 'kg'
      };
    }
    
    const cultivosData = cultivosSheet.getDataRange().getValues();
    const cultivosHeaders = cultivosData[0];
    const cultivoIdIdx = cultivosHeaders.indexOf("ID");
    const idVariedadIdx = cultivosHeaders.indexOf("ID_Variedad");
    
    let variedadId = null;
    for (let i = 1; i < cultivosData.length; i++) {
      if (cultivosData[i][cultivoIdIdx] === cultivoId) {
        variedadId = cultivosData[i][idVariedadIdx];
        break;
      }
    }
    
    // Get variety to find unit
    let unidad = 'kg'; // default
    if (variedadId) {
      const variedadesSheet = ss.getSheetByName("Variedades");
      if (variedadesSheet) {
        const variedadesData = variedadesSheet.getDataRange().getValues();
        const variedadesHeaders = variedadesData[0];
        const varIdIdx = variedadesHeaders.indexOf("ID");
        const unidadIdx = variedadesHeaders.indexOf("Unidad_Rendimiento");
        
        for (let i = 1; i < variedadesData.length; i++) {
          if (variedadesData[i][varIdIdx] === variedadId) {
            unidad = variedadesData[i][unidadIdx] || 'kg';
            break;
          }
        }
      }
    }
    
    // Sum planeada from ciclos
    const ciclosSheet = ss.getSheetByName("Ciclos_Cultivo");
    let totalPlaneada = 0;
    
    if (ciclosSheet) {
      const ciclosData = ciclosSheet.getDataRange().getValues();
      const ciclosHeaders = ciclosData[0];
      const idCultivoIdx = ciclosHeaders.indexOf("ID_Cultivo");
      const cantPlaneadaIdx = ciclosHeaders.indexOf("Cantidad_Planeada");
      
      if (idCultivoIdx !== -1) {
        for (let i = 1; i < ciclosData.length; i++) {
          if (ciclosData[i][idCultivoIdx] === cultivoId) {
            if (cantPlaneadaIdx !== -1) {
              totalPlaneada += Number(ciclosData[i][cantPlaneadaIdx]) || 0;
            }
          }
        }
      }
    }
    
    // Sum producida from Produccion table (Cantidad_Cosechada)
    const produccionSheet = ss.getSheetByName("Produccion");
    let totalProducida = 0;
    
    if (produccionSheet) {
      const produccionData = produccionSheet.getDataRange().getValues();
      const produccionHeaders = produccionData[0];
      const idCultivoIdx = produccionHeaders.indexOf("ID_Cultivo");
      const cantidadCosechadaIdx = produccionHeaders.indexOf("Cantidad_Cosechada");
      
      if (idCultivoIdx !== -1 && cantidadCosechadaIdx !== -1) {
        for (let i = 1; i < produccionData.length; i++) {
          if (produccionData[i][idCultivoIdx] === cultivoId) {
            totalProducida += Number(produccionData[i][cantidadCosechadaIdx]) || 0;
          }
        }
      }
    }
    
    return {
      success: true,
      cantidadPlaneada: Math.round(totalPlaneada * 100) / 100,
      cantidadProducida: Math.round(totalProducida * 100) / 100,
      unidad: unidad
    };
    
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

/**
 * Get production cycles for a variety
 */
function getCiclosProduccion(token, variedadId) {
  _authRequire_(token);
  
  try {
    const ss = SpreadsheetApp.getActive();
    const sheet = ss.getSheetByName("Ciclo_Produccion");
    
    if (!sheet) {
      return { success: false, message: "Hoja Ciclo_Produccion no encontrada" };
    }
    
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      return { success: true, headers: data[0], rows: [] };
    }
    
    const headers = data[0];
    const idVarIdx = headers.indexOf("ID_Variedad");
    
    // Filter rows for this variety
    const rows = [];
    for (let i = 1; i < data.length; i++) {
      if (data[i][idVarIdx] === variedadId) {
        rows.push(data[i]);
      }
    }
    
    // Sort by Nro_Semana
    const nroSemanaIdx = headers.indexOf("Nro_Semana");
    rows.sort((a, b) => (Number(a[nroSemanaIdx]) || 0) - (Number(b[nroSemanaIdx]) || 0));
    
    return { success: true, headers, rows };
    
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

/**
 * Update a production cycle
 */
function updateCicloProduccion(token, cicloId, updates) {
  _authRequire_(token);
  
  try {
    const ss = SpreadsheetApp.getActive();
    const sheet = ss.getSheetByName("Ciclo_Produccion");
    
    if (!sheet) {
      return { success: false, message: "Hoja no encontrada" };
    }
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const idIdx = headers.indexOf("ID");
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][idIdx] === cicloId) {
        // Update specified fields
        for (const [key, value] of Object.entries(updates)) {
          const colIdx = headers.indexOf(key);
          if (colIdx >= 0) {
            sheet.getRange(i + 1, colIdx + 1).setValue(value);
          }
        }
        return { success: true };
      }
    }
    
    return { success: false, message: "Ciclo no encontrado" };
    
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

/**
 * Batch update multiple production cycles
 */
function actualizarCiclosBatch(token, updates) {
  _authRequire_(token);
  
  try {
    const ss = SpreadsheetApp.getActive();
    const sheet = ss.getSheetByName("Ciclo_Produccion");
    
    if (!sheet) {
      return { success: false, message: "Hoja no encontrada" };
    }
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const idIdx = headers.indexOf("ID");
    
    let updatedCount = 0;
    
    // Process each update
    for (const update of updates) {
      const cicloId = update.id;
      const updateData = update.data;
      
      for (let i = 1; i < data.length; i++) {
        if (data[i][idIdx] === cicloId) {
          // Update specified fields
          for (const [key, value] of Object.entries(updateData)) {
            const colIdx = headers.indexOf(key);
            if (colIdx >= 0) {
              sheet.getRange(i + 1, colIdx + 1).setValue(value);
            }
          }
          updatedCount++;
          break;
        }
      }
    }
    
    return { success: true, updated: updatedCount };
    
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

/**
 * Batch update multiple activities
 */
function actualizarActividadesBatch(token, updates) {
  _authRequire_(token);
  
  try {
    const ss = SpreadsheetApp.getActive();
    const sheet = ss.getSheetByName("Actividades");
    
    if (!sheet) {
      return { success: false, message: "Hoja no encontrada" };
    }
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const idIdx = headers.indexOf("ID");
    
    let updatedCount = 0;
    
    // Process each update
    for (const update of updates) {
      const actId = update.id;
      const updateData = update.data;
      
      for (let i = 1; i < data.length; i++) {
        if (data[i][idIdx] === actId) {
          // Update specified fields
          for (const [key, value] of Object.entries(updateData)) {
            const colIdx = headers.indexOf(key);
            if (colIdx >= 0) {
              sheet.getRange(i + 1, colIdx + 1).setValue(value);
            }
          }
          updatedCount++;
          break;
        }
      }
    }
    
    return { success: true, updated: updatedCount };
    
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

/**
 * Delete all production cycles for a variety
 */
function deleteCiclosProduccion(token, variedadId) {
  _authRequire_(token);
  
  try {
    const ss = SpreadsheetApp.getActive();
    const ciclosSheet = ss.getSheetByName("Ciclo_Produccion");
    const variedadesSheet = ss.getSheetByName("Variedades");
    
    if (!ciclosSheet) {
      return { success: false, message: "Hoja no encontrada" };
    }
    
    const data = ciclosSheet.getDataRange().getValues();
    const headers = data[0];
    const idVarIdx = headers.indexOf("ID_Variedad");
    
    let deletedCount = 0;
    for (let i = data.length - 1; i >= 1; i--) {
      if (data[i][idVarIdx] === variedadId) {
        ciclosSheet.deleteRow(i + 1);
        deletedCount++;
      }
    }
    
    // Update variety flag
    if (variedadesSheet) {
      const varData = variedadesSheet.getDataRange().getValues();
      const varHeaders = varData[0];
      const varIdIdx = varHeaders.indexOf("ID");
      const tieneCiclosIdx = varHeaders.indexOf("Tiene_Ciclos_Produccion");
      
      for (let i = 1; i < varData.length; i++) {
        if (varData[i][varIdIdx] === variedadId && tieneCiclosIdx >= 0) {
          variedadesSheet.getRange(i + 1, tieneCiclosIdx + 1).setValue("No");
          break;
        }
      }
    }
    
    return { success: true, message: `${deletedCount} ciclos eliminados` };
    
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

/**
 * Delete all activities for a crop class.
 * claseId = Clases_Cultivo.ID; we delete rows where Actividades.ID_Clase_Cultivo matches.
 */
function deleteActividadesPorClase(token, claseId) {
  _authRequire_(token);
  
  try {
    const ss = SpreadsheetApp.getActive();
    const actividadesSheet = ss.getSheetByName("Actividades");
    
    if (!actividadesSheet) {
      return { success: false, message: "Hoja Actividades no encontrada" };
    }
    
    const data = actividadesSheet.getDataRange().getValues();
    const headers = data[0];
    let idClaseIdx = headers.indexOf("ID_Clase_Cultivo");
    if (idClaseIdx === -1) {
      idClaseIdx = headers.indexOf("Clase_Cultivo"); // legacy column name
    }
    if (idClaseIdx === -1) {
      return { success: false, message: "Columna ID_Clase_Cultivo no encontrada en Actividades" };
    }
    
    let deletedCount = 0;
    const claseIdStr = String(claseId).trim();
    for (let i = data.length - 1; i >= 1; i--) {
      if (String(data[i][idClaseIdx] || "").trim() === claseIdStr) {
        actividadesSheet.deleteRow(i + 1);
        deletedCount++;
      }
    }
    
    return { success: true, message: `${deletedCount} actividades eliminadas` };
    
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

/**
 * Delete all activities for a variety.
 * variedadId = Variedades.ID; we delete rows where Actividades.ID_Variedad matches.
 */
function deleteActividadesPorVariedad(token, variedadId) {
  _authRequire_(token);
  
  try {
    const ss = SpreadsheetApp.getActive();
    const actividadesSheet = ss.getSheetByName("Actividades");
    
    if (!actividadesSheet) {
      return { success: false, message: "Hoja Actividades no encontrada" };
    }
    
    const data = actividadesSheet.getDataRange().getValues();
    const headers = data[0];
    const idVariedadIdx = headers.indexOf("ID_Variedad");
    if (idVariedadIdx === -1) {
      return { success: false, message: "Columna ID_Variedad no encontrada en Actividades" };
    }
    
    let deletedCount = 0;
    const variedadIdStr = String(variedadId).trim();
    for (let i = data.length - 1; i >= 1; i--) {
      if (String(data[i][idVariedadIdx] || "").trim() === variedadIdStr) {
        actividadesSheet.deleteRow(i + 1);
        deletedCount++;
      }
    }
    
    return { success: true, message: `${deletedCount} actividades eliminadas` };
    
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

// ==============================
// MIGRATION FUNCTIONS
// ==============================

/**
 * One-time migration: Convert existing Cultivos from Variedad (name) to ID_Variedad (UUID)
 * Run this manually from Apps Script editor after updating the schema.
 * 
 * Usage: Run migrarCultivosAIdVariedad() from the Apps Script editor
 */
function migrarCultivosAIdVariedad() {
  const ss = SpreadsheetApp.getActive();
  const cultivosSheet = ss.getSheetByName("Cultivos");
  const variedadesSheet = ss.getSheetByName("Variedades");
  
  if (!cultivosSheet || !variedadesSheet) {
    Logger.log("Error: Hojas Cultivos o Variedades no encontradas");
    return;
  }
  
  const cultivosData = cultivosSheet.getDataRange().getValues();
  const variedadesData = variedadesSheet.getDataRange().getValues();
  
  // Get column headers
  const cultivosHeaders = cultivosData[0];
  const variedadesHeaders = variedadesData[0];
  
  // Find column indices
  const variedadColIdx = cultivosHeaders.indexOf("ID_Variedad");
  if (variedadColIdx === -1) {
    // Try old column name
    const oldIdx = cultivosHeaders.indexOf("Variedad");
    if (oldIdx === -1) {
      Logger.log("Error: No se encontró columna Variedad ni ID_Variedad en Cultivos");
      return;
    }
    Logger.log("Nota: La columna aún se llama 'Variedad'. Actualice el header a 'ID_Variedad' manualmente o ejecute setupAllTables().");
  }
  
  const varIdIdx = variedadesHeaders.indexOf("ID");
  const varNombreIdx = variedadesHeaders.indexOf("Nombre");
  
  // Build name -> ID map from Variedades
  const variedadMap = {};
  for (let i = 1; i < variedadesData.length; i++) {
    const id = variedadesData[i][varIdIdx];
    const nombre = variedadesData[i][varNombreIdx];
    if (nombre && id) {
      variedadMap[nombre] = id;
    }
  }
  
  Logger.log("Variedades encontradas: " + Object.keys(variedadMap).length);
  
  // Update Cultivos - convert name to ID
  let updatedCount = 0;
  let skippedCount = 0;
  const colToUpdate = (variedadColIdx !== -1) ? variedadColIdx : cultivosHeaders.indexOf("Variedad");
  
  for (let i = 1; i < cultivosData.length; i++) {
    const currentValue = cultivosData[i][colToUpdate];
    
    // Skip if already looks like a UUID
    if (currentValue && String(currentValue).match(/^[a-f0-9-]{36}$/i)) {
      skippedCount++;
      continue;
    }
    
    // Try to find matching variedad ID
    if (currentValue && variedadMap[currentValue]) {
      cultivosSheet.getRange(i + 1, colToUpdate + 1).setValue(variedadMap[currentValue]);
      updatedCount++;
      Logger.log(`Fila ${i + 1}: "${currentValue}" -> ${variedadMap[currentValue]}`);
    } else if (currentValue) {
      Logger.log(`Fila ${i + 1}: Variedad "${currentValue}" no encontrada en catálogo`);
    }
  }
  
  Logger.log(`Migración completada. Actualizados: ${updatedCount}, Omitidos (ya UUID): ${skippedCount}`);
}

/**
 * Get Actividades_Cultivo for a specific cultivo
 * Returns activities with their details for cost registration
 */
function getActividadesCultivo(token, cultivoId) {
  _authRequire_(token);
  
  try {
    const ss = SpreadsheetApp.getActive();
    const sheet = ss.getSheetByName("Actividades_Cultivo");
    
    if (!sheet) {
      return { success: true, actividades: [] };
    }
    
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      return { success: true, actividades: [] };
    }
    
    const headers = data[0];
    const idIdx = headers.indexOf("ID");
    const idCultivoIdx = headers.indexOf("ID_Cultivo");
    const nombreIdx = headers.indexOf("Nombre_Actividad");
    const tiempoIdx = headers.indexOf("Tiempo_Requerido_Min");
    const estadoIdx = headers.indexOf("Estado");
    const semanaIdx = headers.indexOf("Nro_Semana");
    const fechaIdx = headers.indexOf("Fecha_Planeada");
    
    const actividades = [];
    for (let i = 1; i < data.length; i++) {
      // Compare as strings to handle type mismatch (select value is string, sheet may have number)
      if (String(data[i][idCultivoIdx]) === String(cultivoId)) {
        actividades.push({
          ID: data[i][idIdx],
          Nombre_Actividad: data[i][nombreIdx] || '',
          Tiempo_Requerido_Min: Number(data[i][tiempoIdx]) || 0,
          Estado: data[i][estadoIdx] || 'Pendiente',
          Nro_Semana: Number(data[i][semanaIdx]) || 0,
          Fecha_Planeada: data[i][fechaIdx] instanceof Date ? Utilities.formatDate(data[i][fechaIdx], Session.getScriptTimeZone(), "yyyy-MM-dd") : (data[i][fechaIdx] || '')
        });
      }
    }
    
    // Sort by Nro_Semana then by Nombre
    actividades.sort((a, b) => {
      if (a.Nro_Semana !== b.Nro_Semana) return a.Nro_Semana - b.Nro_Semana;
      return (a.Nombre_Actividad || '').localeCompare(b.Nombre_Actividad || '');
    });
    
    return { success: true, actividades };
    
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

/**
 * Get Insumos_Cultivo for a specific cultivo
 * Returns insumos with their details, linked activity info, and Valor_Unitario from Insumos catalog
 */
function getInsumosCultivo(token, cultivoId) {
  _authRequire_(token);
  
  try {
    const ss = SpreadsheetApp.getActive();
    const sheet = ss.getSheetByName("Insumos_Cultivo");
    
    if (!sheet) {
      return { success: true, insumos: [] };
    }
    
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      return { success: true, insumos: [] };
    }
    
    // Load Insumos catalog for Valor_Unitario lookup
    const insumosSheet = ss.getSheetByName("Insumos");
    const insumosMap = {};
    if (insumosSheet) {
      const insumosData = insumosSheet.getDataRange().getValues();
      const insumosHeaders = insumosData[0];
      const insIdIdx = insumosHeaders.indexOf("ID");
      const valorIdx = insumosHeaders.indexOf("Valor_Unitario");
      
      for (let i = 1; i < insumosData.length; i++) {
        insumosMap[insumosData[i][insIdIdx]] = Number(insumosData[i][valorIdx]) || 0;
      }
    }
    
    // Load Actividades_Cultivo for linked activity info
    const actividadesCultivoSheet = ss.getSheetByName("Actividades_Cultivo");
    const actividadesMap = {}; // ID -> {Nombre_Actividad, Fecha_Planeada, Nro_Semana}
    if (actividadesCultivoSheet) {
      const acData = actividadesCultivoSheet.getDataRange().getValues();
      const acHeaders = acData[0];
      const acIdIdx = acHeaders.indexOf("ID");
      const acNombreIdx = acHeaders.indexOf("Nombre_Actividad");
      const acFechaIdx = acHeaders.indexOf("Fecha_Planeada");
      const acSemanaIdx = acHeaders.indexOf("Nro_Semana");
      
      for (let i = 1; i < acData.length; i++) {
        const id = acData[i][acIdIdx];
        if (id) {
          actividadesMap[id] = {
            Nombre_Actividad: acData[i][acNombreIdx] || '',
            Fecha_Planeada: acData[i][acFechaIdx] || '',
            Nro_Semana: Number(acData[i][acSemanaIdx]) || 0
          };
        }
      }
    }
    
    const headers = data[0];
    const idIdx = headers.indexOf("ID");
    const idCultivoIdx = headers.indexOf("ID_Cultivo");
    const idActividadCultivoIdx = headers.indexOf("ID_Actividad_Cultivo");
    const idInsumoIdx = headers.indexOf("ID_Insumo");
    const nombreIdx = headers.indexOf("Nombre_Insumo");
    const cantidadIdx = headers.indexOf("Cantidad_Requerida");
    const unidadIdx = headers.indexOf("Unidad_Medida");
    const estadoIdx = headers.indexOf("Estado");
    const semanaIdx = headers.indexOf("Nro_Semana");
    const fechaPlaneadaIdx = headers.indexOf("Fecha_Planeada");
    
    const insumos = [];
    for (let i = 1; i < data.length; i++) {
      // Compare as strings to handle type mismatch (select value is string, sheet may have number)
      if (String(data[i][idCultivoIdx]) === String(cultivoId)) {
        const idInsumo = data[i][idInsumoIdx];
        const idActividadCultivo = data[i][idActividadCultivoIdx] || '';
        
        // Get linked activity info
        const actividadInfo = actividadesMap[idActividadCultivo] || {};
        
        insumos.push({
          ID: data[i][idIdx],
          ID_Insumo: idInsumo,
          ID_Actividad_Cultivo: idActividadCultivo,
          Nombre_Insumo: data[i][nombreIdx] || '',
          Cantidad_Requerida: Number(data[i][cantidadIdx]) || 0,
          Unidad_Medida: data[i][unidadIdx] || '',
          Valor_Unitario: insumosMap[idInsumo] || 0,
          Estado: data[i][estadoIdx] || 'Pendiente',
          Nro_Semana: Number(data[i][semanaIdx]) || 0,
          Fecha_Planeada: data[i][fechaPlaneadaIdx] instanceof Date ? Utilities.formatDate(data[i][fechaPlaneadaIdx], Session.getScriptTimeZone(), "yyyy-MM-dd") : (data[i][fechaPlaneadaIdx] || ''),
          // Linked activity info
          Actividad_Nombre: actividadInfo.Nombre_Actividad || '',
          Actividad_Fecha: actividadInfo.Fecha_Planeada || '',
          Actividad_Semana: actividadInfo.Nro_Semana || 0
        });
      }
    }
    
    // Sort by Nro_Semana then by Nombre
    insumos.sort((a, b) => {
      if (a.Nro_Semana !== b.Nro_Semana) return a.Nro_Semana - b.Nro_Semana;
      return (a.Nombre_Insumo || '').localeCompare(b.Nombre_Insumo || '');
    });
    
    return { success: true, insumos };
    
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

// ==============================
// CULTIVO DATA EDITORS - Get Functions
// ==============================

/**
 * Get Ciclos_Cultivo for editing in modal
 * Returns all fields needed for inline editing
 */
function getCiclosCultivoForEdit(token, cultivoId) {
  _authRequire_(token);
  
  try {
    const ss = SpreadsheetApp.getActive();
    const sheet = ss.getSheetByName("Ciclos_Cultivo");
    
    if (!sheet) {
      return { success: true, rows: [] };
    }
    
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      return { success: true, rows: [] };
    }
    
    const headers = data[0];
    const idIdx = headers.indexOf("ID");
    const idCultivoIdx = headers.indexOf("ID_Cultivo");
    const cicloProduccionIdx = headers.indexOf("Ciclo_Produccion");
    const nroSemanaIdx = headers.indexOf("Nro_Semana");
    const fechaPlaneadaIdx = headers.indexOf("Fecha_Planeada");
    const tasaProduccionIdx = headers.indexOf("Tasa_Produccion");
    const cantidadPlaneadaIdx = headers.indexOf("Cantidad_Planeada");
    const fechaEfectivaIdx = headers.indexOf("Fecha_Efectiva");
    const perdidasIdx = headers.indexOf("Perdidas");
    const cantidadProducidaIdx = headers.indexOf("Cantidad_Producida");
    const estadoIdx = headers.indexOf("Estado");
    const observacionesIdx = headers.indexOf("Observaciones");
    
    const rows = [];
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][idCultivoIdx]) === String(cultivoId)) {
        rows.push({
          ID: data[i][idIdx],
          Ciclo_Produccion: data[i][cicloProduccionIdx] || '',
          Nro_Semana: Number(data[i][nroSemanaIdx]) || 0,
          Fecha_Planeada: data[i][fechaPlaneadaIdx] instanceof Date ? Utilities.formatDate(data[i][fechaPlaneadaIdx], Session.getScriptTimeZone(), "yyyy-MM-dd") : (data[i][fechaPlaneadaIdx] || ''),
          Tasa_Produccion: Number(data[i][tasaProduccionIdx]) || 0,
          Cantidad_Planeada: Number(data[i][cantidadPlaneadaIdx]) || 0,
          Fecha_Efectiva: data[i][fechaEfectivaIdx] instanceof Date ? Utilities.formatDate(data[i][fechaEfectivaIdx], Session.getScriptTimeZone(), "yyyy-MM-dd") : (data[i][fechaEfectivaIdx] || ''),
          Perdidas: Number(data[i][perdidasIdx]) || 0,
          Cantidad_Producida: Number(data[i][cantidadProducidaIdx]) || 0,
          Estado: data[i][estadoIdx] || 'Planeado',
          Observaciones: data[i][observacionesIdx] || ''
        });
      }
    }
    
    // Sort by Nro_Semana
    rows.sort((a, b) => a.Nro_Semana - b.Nro_Semana);
    
    return { success: true, rows };
    
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

/**
 * Get Actividades_Cultivo for editing in modal
 * Returns all fields needed for inline editing
 */
function getActividadesCultivoForEdit(token, cultivoId) {
  _authRequire_(token);
  
  try {
    const ss = SpreadsheetApp.getActive();
    const sheet = ss.getSheetByName("Actividades_Cultivo");
    
    if (!sheet) {
      return { success: true, rows: [] };
    }
    
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      return { success: true, rows: [] };
    }
    
    const headers = data[0];
    const idIdx = headers.indexOf("ID");
    const idCultivoIdx = headers.indexOf("ID_Cultivo");
    const nombreActividadIdx = headers.indexOf("Nombre_Actividad");
    const nroSemanaIdx = headers.indexOf("Nro_Semana");
    const fechaPlaneadaIdx = headers.indexOf("Fecha_Planeada");
    const tiempoRequeridoIdx = headers.indexOf("Tiempo_Requerido_Min");
    const tiempoEfectivoIdx = headers.indexOf("Tiempo_Efectivo_Min");
    const responsableIdx = headers.indexOf("Responsable");
    const estadoIdx = headers.indexOf("Estado");
    const observacionesIdx = headers.indexOf("Observaciones");
    
    const rows = [];
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][idCultivoIdx]) === String(cultivoId)) {
        rows.push({
          ID: data[i][idIdx],
          Nombre_Actividad: data[i][nombreActividadIdx] || '',
          Nro_Semana: Number(data[i][nroSemanaIdx]) || 0,
          Fecha_Planeada: data[i][fechaPlaneadaIdx] instanceof Date ? Utilities.formatDate(data[i][fechaPlaneadaIdx], Session.getScriptTimeZone(), "yyyy-MM-dd") : (data[i][fechaPlaneadaIdx] || ''),
          Tiempo_Requerido_Min: Number(data[i][tiempoRequeridoIdx]) || 0,
          Tiempo_Efectivo_Min: Number(data[i][tiempoEfectivoIdx]) || 0,
          Responsable: data[i][responsableIdx] || '',
          Estado: data[i][estadoIdx] || 'Pendiente',
          Observaciones: data[i][observacionesIdx] || ''
        });
      }
    }
    
    // Sort by Nro_Semana then by Nombre
    rows.sort((a, b) => {
      if (a.Nro_Semana !== b.Nro_Semana) return a.Nro_Semana - b.Nro_Semana;
      return (a.Nombre_Actividad || '').localeCompare(b.Nombre_Actividad || '');
    });
    
    return { success: true, rows };
    
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

/**
 * Get Insumos_Cultivo for editing in modal
 * Returns all fields needed for inline editing
 */
function getInsumosCultivoForEdit(token, cultivoId) {
  _authRequire_(token);
  
  try {
    const ss = SpreadsheetApp.getActive();
    const sheet = ss.getSheetByName("Insumos_Cultivo");
    
    if (!sheet) {
      return { success: true, rows: [] };
    }
    
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      return { success: true, rows: [] };
    }
    
    const headers = data[0];
    const idIdx = headers.indexOf("ID");
    const idCultivoIdx = headers.indexOf("ID_Cultivo");
    const idInsumoIdx = headers.indexOf("ID_Insumo");
    const nombreInsumoIdx = headers.indexOf("Nombre_Insumo");
    const cantidadIdx = headers.indexOf("Cantidad_Requerida");
    const unidadIdx = headers.indexOf("Unidad_Medida");
    const estadoIdx = headers.indexOf("Estado");
    const nroSemanaIdx = headers.indexOf("Nro_Semana");
    const fechaPlaneadaIdx = headers.indexOf("Fecha_Planeada");
    
    const rows = [];
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][idCultivoIdx]) === String(cultivoId)) {
        rows.push({
          ID: data[i][idIdx],
          ID_Insumo: data[i][idInsumoIdx] || '',
          Nombre_Insumo: data[i][nombreInsumoIdx] || '',
          Cantidad_Requerida: Number(data[i][cantidadIdx]) || 0,
          Unidad_Medida: data[i][unidadIdx] || '',
          Estado: data[i][estadoIdx] || 'Pendiente',
          Nro_Semana: Number(data[i][nroSemanaIdx]) || 0,
          Fecha_Planeada: data[i][fechaPlaneadaIdx] instanceof Date ? Utilities.formatDate(data[i][fechaPlaneadaIdx], Session.getScriptTimeZone(), "yyyy-MM-dd") : (data[i][fechaPlaneadaIdx] || '')
        });
      }
    }
    
    // Sort by Nro_Semana then by Nombre
    rows.sort((a, b) => {
      if (a.Nro_Semana !== b.Nro_Semana) return a.Nro_Semana - b.Nro_Semana;
      return (a.Nombre_Insumo || '').localeCompare(b.Nombre_Insumo || '');
    });
    
    return { success: true, rows };
    
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

// ==============================
// CULTIVO DATA EDITORS - Bulk Save Functions
// ==============================

/**
 * Bulk save Ciclos_Cultivo
 * Updates existing, inserts new, deletes marked rows
 */
function saveCiclosCultivoBulk(token, cultivoId, rows) {
  _authRequire_(token);
  
  try {
    const ss = SpreadsheetApp.getActive();
    const sheet = ss.getSheetByName("Ciclos_Cultivo");
    
    if (!sheet) {
      return { success: false, message: "Hoja Ciclos_Cultivo no encontrada" };
    }
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const idIdx = headers.indexOf("ID");
    const idCultivoIdx = headers.indexOf("ID_Cultivo");
    
    let updated = 0;
    let inserted = 0;
    let deleted = 0;
    
    // Build map of existing rows
    const existingMap = {};
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][idCultivoIdx]) === String(cultivoId)) {
        existingMap[data[i][idIdx]] = i + 1; // Store sheet row number
      }
    }
    
    // Process incoming rows
    for (const row of rows) {
      if (row._deleted) {
        // Delete row if it exists
        if (existingMap[row.ID]) {
          sheet.deleteRow(existingMap[row.ID]);
          deleted++;
          // Adjust map for subsequent operations
          for (const key in existingMap) {
            if (existingMap[key] > existingMap[row.ID]) {
              existingMap[key]--;
            }
          }
          delete existingMap[row.ID];
        }
      } else if (String(row.ID).startsWith('new-')) {
        // Insert new row
        const newId = Utilities.getUuid();
        const consecutivo = sheet.getLastRow();
        const newRow = [
          newId,
          consecutivo,
          cultivoId,
          row.Ciclo_Produccion || '',
          Number(row.Nro_Semana) || 0,
          row.Fecha_Planeada || '',
          Number(row.Tasa_Produccion) || 0,
          Number(row.Cantidad_Planeada) || 0,
          row.Fecha_Efectiva || '',
          Number(row.Perdidas) || 0,
          Number(row.Cantidad_Producida) || 0,
          row.Estado || 'Planeado',
          row.Observaciones || ''
        ];
        sheet.appendRow(newRow);
        inserted++;
      } else if (existingMap[row.ID]) {
        // Update existing row
        const rowNum = existingMap[row.ID];
        const rowData = [];
        
        for (let i = 0; i < headers.length; i++) {
          const header = headers[i];
          if (header === 'ID' || header === 'ID_Cultivo' || header === 'Consecutivo') {
            rowData.push(data[rowNum - 1][i]); // Keep original
          } else if (row.hasOwnProperty(header)) {
            rowData.push(row[header]);
          } else {
            rowData.push(data[rowNum - 1][i]); // Keep original
          }
        }
        
        sheet.getRange(rowNum, 1, 1, rowData.length).setValues([rowData]);
        updated++;
      }
    }
    
    return { 
      success: true, 
      message: `Guardado: ${updated} actualizados, ${inserted} insertados, ${deleted} eliminados`,
      updated, inserted, deleted
    };
    
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

/**
 * Bulk save Actividades_Cultivo
 * Updates existing, inserts new, deletes marked rows
 */
function saveActividadesCultivoBulk(token, cultivoId, rows) {
  _authRequire_(token);
  
  try {
    const ss = SpreadsheetApp.getActive();
    const sheet = ss.getSheetByName("Actividades_Cultivo");
    
    if (!sheet) {
      return { success: false, message: "Hoja Actividades_Cultivo no encontrada" };
    }
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const idIdx = headers.indexOf("ID");
    const idCultivoIdx = headers.indexOf("ID_Cultivo");
    
    let updated = 0;
    let inserted = 0;
    let deleted = 0;
    
    // Build map of existing rows
    const existingMap = {};
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][idCultivoIdx]) === String(cultivoId)) {
        existingMap[data[i][idIdx]] = i + 1;
      }
    }
    
    // Process incoming rows
    for (const row of rows) {
      if (row._deleted) {
        if (existingMap[row.ID]) {
          sheet.deleteRow(existingMap[row.ID]);
          deleted++;
          for (const key in existingMap) {
            if (existingMap[key] > existingMap[row.ID]) {
              existingMap[key]--;
            }
          }
          delete existingMap[row.ID];
        }
      } else if (String(row.ID).startsWith('new-')) {
        // Insert new row
        const newId = Utilities.getUuid();
        const consecutivo = sheet.getLastRow(); // Simple consecutivo
        const newRow = [
          newId,
          consecutivo,
          cultivoId,
          '', // ID_Actividad (empty for manual entries)
          row.Nombre_Actividad || '',
          Number(row.Nro_Semana) || 0,
          row.Fecha_Planeada || '',
          Number(row.Tiempo_Requerido_Min) || 0,
          Number(row.Tiempo_Efectivo_Min) || 0,
          row.Responsable || '',
          row.Estado || 'Pendiente',
          row.Observaciones || ''
        ];
        sheet.appendRow(newRow);
        inserted++;
      } else if (existingMap[row.ID]) {
        // Update existing row
        const rowNum = existingMap[row.ID];
        const rowData = [];
        
        for (let i = 0; i < headers.length; i++) {
          const header = headers[i];
          if (header === 'ID' || header === 'ID_Cultivo' || header === 'Consecutivo' || header === 'ID_Actividad') {
            rowData.push(data[rowNum - 1][i]); // Keep original
          } else if (row.hasOwnProperty(header)) {
            rowData.push(row[header]);
          } else {
            rowData.push(data[rowNum - 1][i]);
          }
        }
        
        sheet.getRange(rowNum, 1, 1, rowData.length).setValues([rowData]);
        updated++;
      }
    }
    
    return { 
      success: true, 
      message: `Guardado: ${updated} actualizados, ${inserted} insertados, ${deleted} eliminados`,
      updated, inserted, deleted
    };
    
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

/**
 * Bulk save Insumos_Cultivo
 * Updates existing, inserts new, deletes marked rows
 */
function saveInsumosCultivoBulk(token, cultivoId, rows) {
  _authRequire_(token);
  
  try {
    const ss = SpreadsheetApp.getActive();
    const sheet = ss.getSheetByName("Insumos_Cultivo");
    
    if (!sheet) {
      return { success: false, message: "Hoja Insumos_Cultivo no encontrada" };
    }
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const idIdx = headers.indexOf("ID");
    const idCultivoIdx = headers.indexOf("ID_Cultivo");
    
    let updated = 0;
    let inserted = 0;
    let deleted = 0;
    
    // Build map of existing rows
    const existingMap = {};
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][idCultivoIdx]) === String(cultivoId)) {
        existingMap[data[i][idIdx]] = i + 1;
      }
    }
    
    // Process incoming rows
    for (const row of rows) {
      if (row._deleted) {
        if (existingMap[row.ID]) {
          sheet.deleteRow(existingMap[row.ID]);
          deleted++;
          for (const key in existingMap) {
            if (existingMap[key] > existingMap[row.ID]) {
              existingMap[key]--;
            }
          }
          delete existingMap[row.ID];
        }
      } else if (String(row.ID).startsWith('new-')) {
        // Insert new row
        const newId = Utilities.getUuid();
        const newRow = [
          newId,
          cultivoId,
          '', // ID_Actividad_Cultivo (empty for manual entries)
          row.ID_Insumo || '',
          row.Nombre_Insumo || '',
          Number(row.Cantidad_Requerida) || 0,
          row.Unidad_Medida || '',
          row.Estado || 'Pendiente',
          Number(row.Nro_Semana) || 0,
          row.Fecha_Planeada || ''
        ];
        sheet.appendRow(newRow);
        inserted++;
      } else if (existingMap[row.ID]) {
        // Update existing row
        const rowNum = existingMap[row.ID];
        const rowData = [];
        
        for (let i = 0; i < headers.length; i++) {
          const header = headers[i];
          if (header === 'ID' || header === 'ID_Cultivo' || header === 'ID_Actividad_Cultivo') {
            rowData.push(data[rowNum - 1][i]); // Keep original
          } else if (row.hasOwnProperty(header)) {
            rowData.push(row[header]);
          } else {
            rowData.push(data[rowNum - 1][i]);
          }
        }
        
        sheet.getRange(rowNum, 1, 1, rowData.length).setValues([rowData]);
        updated++;
      }
    }
    
    return { 
      success: true, 
      message: `Guardado: ${updated} actualizados, ${inserted} insertados, ${deleted} eliminados`,
      updated, inserted, deleted
    };
    
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

// ==============================
// REPORTS - Week Calculation Utilities
// ==============================

/**
 * Convert any date-like value to a Date object
 * @param {*} value
 * @returns {Date|null}
 */
function toDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'string' || typeof value === 'number') {
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

/**
 * Sanitize report data to ensure proper serialization through postMessage
 * Converts Date objects to ISO strings and cleans property keys
 * @param {Array} arr - Array of objects to sanitize
 * @returns {Array}
 */
function sanitizeReportData(arr) {
  return arr.map(obj => {
    const clean = {};
    for (const key in obj) {
      let val = obj[key];
      if (val instanceof Date) {
        val = val.toISOString();
      }
      clean[String(key).trim()] = val;
    }
    return clean;
  });
}

/**
 * Get ISO 8601 week number for a date
 * Week 1 is the first week with Thursday in January (or containing Jan 4)
 * @param {Date} date
 * @returns {Object} {year, week, startDate, endDate, dateRange}
 */
function getWeekInfo(date) {
  const parsedDate = toDate(date);
  if (!parsedDate) {
    return null;
  }
  
  const d = new Date(parsedDate.getTime());
  d.setHours(0, 0, 0, 0);
  
  // Set to nearest Thursday: current date + 4 - current day number
  // Make Sunday's day number 7
  const dayNum = d.getDay() || 7;
  d.setDate(d.getDate() + 4 - dayNum);
  
  // Get first day of year
  const yearStart = new Date(d.getFullYear(), 0, 1);
  
  // Calculate full weeks to nearest Thursday
  const weekNum = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  
  // Get the Monday of this week
  const monday = new Date(d.getTime());
  monday.setDate(monday.getDate() - 3); // Thursday - 3 days = Monday
  
  // Get the Sunday of this week
  const sunday = new Date(monday.getTime());
  sunday.setDate(sunday.getDate() + 6);
  
  // Format date range
  const formatDate = function(dt) {
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return dt.getDate() + ' ' + months[dt.getMonth()];
  };
  
  const dateRange = formatDate(monday) + ' - ' + formatDate(sunday);
  
  return {
    year: d.getFullYear(),
    week: weekNum,
    startDate: monday,
    endDate: sunday,
    dateRange: dateRange
  };
}

/**
 * Get all weeks in a year with date ranges
 * @param {Number} year
 * @returns {Array} [{weekNum, startDate, endDate, dateRange, monthName}]
 */
function getYearWeekStructure(year) {
  const weeks = [];
  const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  
  // Start from January 1st
  let currentDate = new Date(year, 0, 1);
  
  // Find the first Monday of the year (or previous Monday if Jan 1 is not Monday)
  const firstDayOfWeek = currentDate.getDay();
  if (firstDayOfWeek !== 1) {
    const daysToMonday = firstDayOfWeek === 0 ? -6 : 1 - firstDayOfWeek;
    currentDate.setDate(currentDate.getDate() + daysToMonday);
  }
  
  let weekNum = 1;
  const maxWeeks = 53;
  
  while (weekNum <= maxWeeks && currentDate.getFullYear() <= year) {
    const weekInfo = getWeekInfo(new Date(currentDate.getTime() + (3 * 86400000))); // Use Thursday of the week
    
    if (!weekInfo || weekInfo.year !== year) {
      break;
    }
    
    weeks.push({
      weekNum: weekInfo.week,
      startDate: weekInfo.startDate,
      endDate: weekInfo.endDate,
      dateRange: weekInfo.dateRange,
      monthName: months[weekInfo.startDate.getMonth()]
    });
    
    // Move to next week
    currentDate.setDate(currentDate.getDate() + 7);
    weekNum++;
  }
  
  return weeks;
}

// ==============================
// REPORTS - Data Functions
// ==============================

/**
 * Get production forecast report grouped by week
 * @param {String} token - Auth token
 * @param {Object} filters - {year, weekStart, weekEnd, ubicaciones[], variedades[]}
 * @returns {Object} {success, data: [{weekNum, dateRange, ubicacion, variedad, cantidadPlaneada}]}
 */
function getReportCiclosCultivo(token, filters) {
  try {
    _authRequire_(token);
    
    const ss = SpreadsheetApp.getActive();
    
    // Get all required sheets
    const ciclosSheet = ss.getSheetByName("Ciclos_Cultivo");
    const cultivosSheet = ss.getSheetByName("Cultivos");
    const ubicacionesSheet = ss.getSheetByName("Ubicaciones");
    const variedadesSheet = ss.getSheetByName("Variedades");
    
    if (!ciclosSheet || !cultivosSheet || !ubicacionesSheet || !variedadesSheet) {
      return { success: false, message: "Faltan hojas requeridas para el reporte" };
    }
    
    // Get headers and data from Ciclos_Cultivo
    const ciclosLastRow = ciclosSheet.getLastRow();
    if (ciclosLastRow < 2) {
      return { success: true, data: [] };
    }
    
    const ciclosHeaders = ciclosSheet.getRange(1, 1, 1, ciclosSheet.getLastColumn()).getValues()[0];
    const ciclosData = ciclosSheet.getRange(2, 1, ciclosLastRow - 1, ciclosSheet.getLastColumn()).getValues();
    
    const idCultivoIdx = ciclosHeaders.indexOf("ID_Cultivo");
    const fechaPlaneadaIdx = ciclosHeaders.indexOf("Fecha_Planeada");
    const cantidadPlaneadaIdx = ciclosHeaders.indexOf("Cantidad_Planeada");
    
    // Get Cultivos data
    const cultivosLastRow = cultivosSheet.getLastRow();
    const cultivosHeaders = cultivosSheet.getRange(1, 1, 1, cultivosSheet.getLastColumn()).getValues()[0];
    const cultivosData = cultivosLastRow >= 2 ? cultivosSheet.getRange(2, 1, cultivosLastRow - 1, cultivosSheet.getLastColumn()).getValues() : [];
    
    const cultivoIdIdx = cultivosHeaders.indexOf("ID");
    const cultivoUbicacionIdx = cultivosHeaders.indexOf("ID_Ubicacion");
    const cultivoVariedadIdx = cultivosHeaders.indexOf("ID_Variedad");
    
    // Create Cultivos lookup map
    const cultivosMap = {};
    for (let i = 0; i < cultivosData.length; i++) {
      const id = cultivosData[i][cultivoIdIdx];
      cultivosMap[id] = {
        idUbicacion: cultivosData[i][cultivoUbicacionIdx],
        idVariedad: cultivosData[i][cultivoVariedadIdx]
      };
    }
    
    // Get Ubicaciones data
    const ubicacionesLastRow = ubicacionesSheet.getLastRow();
    const ubicacionesHeaders = ubicacionesSheet.getRange(1, 1, 1, ubicacionesSheet.getLastColumn()).getValues()[0];
    const ubicacionesData = ubicacionesLastRow >= 2 ? ubicacionesSheet.getRange(2, 1, ubicacionesLastRow - 1, ubicacionesSheet.getLastColumn()).getValues() : [];
    
    const ubicacionIdIdx = ubicacionesHeaders.indexOf("ID");
    const ubicacionNombreIdx = ubicacionesHeaders.indexOf("Nombre_Cultivo");
    
    // Create Ubicaciones lookup map
    const ubicacionesMap = {};
    for (let i = 0; i < ubicacionesData.length; i++) {
      const id = ubicacionesData[i][ubicacionIdIdx];
      ubicacionesMap[id] = ubicacionesData[i][ubicacionNombreIdx] || 'Sin Ubicación';
    }
    
    // Get Variedades data
    const variedadesLastRow = variedadesSheet.getLastRow();
    const variedadesHeaders = variedadesSheet.getRange(1, 1, 1, variedadesSheet.getLastColumn()).getValues()[0];
    const variedadesData = variedadesLastRow >= 2 ? variedadesSheet.getRange(2, 1, variedadesLastRow - 1, variedadesSheet.getLastColumn()).getValues() : [];
    
    const variedadIdIdx = variedadesHeaders.indexOf("ID");
    const variedadNombreIdx = variedadesHeaders.indexOf("Nombre");
    
    // Create Variedades lookup map
    const variedadesMap = {};
    for (let i = 0; i < variedadesData.length; i++) {
      const id = variedadesData[i][variedadIdIdx];
      variedadesMap[id] = variedadesData[i][variedadNombreIdx] || 'Sin Variedad';
    }
    
    // Process Ciclos data and aggregate
    const aggregated = {};
    
    for (let i = 0; i < ciclosData.length; i++) {
      const idCultivo = ciclosData[i][idCultivoIdx];
      const fechaPlaneadaRaw = ciclosData[i][fechaPlaneadaIdx];
      const cantidadPlaneada = Number(ciclosData[i][cantidadPlaneadaIdx]) || 0;
      
      // Convert date using helper function
      const fechaPlaneada = toDate(fechaPlaneadaRaw);
      
      if (!idCultivo || !fechaPlaneada) {
        continue;
      }
      
      // Get cultivo info
      const cultivoInfo = cultivosMap[idCultivo];
      if (!cultivoInfo) continue;
      
      const idUbicacion = cultivoInfo.idUbicacion;
      const idVariedad = cultivoInfo.idVariedad;
      
      // Apply filters - ubicaciones
      if (filters.ubicaciones && filters.ubicaciones.length > 0 && !filters.ubicaciones.includes('ALL')) {
        if (!filters.ubicaciones.includes(idUbicacion)) {
          continue;
        }
      }
      
      // Apply filters - variedades
      if (filters.variedades && filters.variedades.length > 0 && !filters.variedades.includes('ALL')) {
        if (!filters.variedades.includes(idVariedad)) {
          continue;
        }
      }
      
      // Calculate week info
      const weekInfo = getWeekInfo(fechaPlaneada);
      if (!weekInfo) continue;
      
      // Apply week filter
      if (weekInfo.year !== filters.year) continue;
      if (weekInfo.week < filters.weekStart || weekInfo.week > filters.weekEnd) continue;
      
      // Get names
      const ubicacionNombre = ubicacionesMap[idUbicacion] || 'Sin Ubicación';
      const variedadNombre = variedadesMap[idVariedad] || 'Sin Variedad';
      
      // Create aggregation key
      const key = weekInfo.week + '|' + idUbicacion + '|' + idVariedad;
      
      if (!aggregated[key]) {
        aggregated[key] = {
          weekNum: weekInfo.week,
          dateRange: weekInfo.dateRange,
          ubicacion: ubicacionNombre,
          variedad: variedadNombre,
          cantidadPlaneada: 0
        };
      }
      
      aggregated[key].cantidadPlaneada += cantidadPlaneada;
    }
    
    // Convert to array and sort
    const result = Object.values(aggregated).sort((a, b) => {
      if (a.weekNum !== b.weekNum) return a.weekNum - b.weekNum;
      if (a.ubicacion !== b.ubicacion) return a.ubicacion.localeCompare(b.ubicacion);
      return a.variedad.localeCompare(b.variedad);
    });
    
    // Sanitize data to ensure proper serialization through postMessage
    const sanitizedResult = sanitizeReportData(result);
    
    return { success: true, data: sanitizedResult };
    
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

/**
 * Get labor requirements report grouped by week
 * @param {String} token - Auth token
 * @param {Object} filters - {year, weekStart, weekEnd, ubicaciones[], variedades[]}
 * @returns {Object} {success, data: [{weekNum, dateRange, cultivo, actividad, tiempoHoras}]}
 */
function getReportActividades(token, filters) {
  try {
    _authRequire_(token);
    
    const ss = SpreadsheetApp.getActive();
    
    // Get all required sheets
    const actividadesSheet = ss.getSheetByName("Actividades_Cultivo");
    const cultivosSheet = ss.getSheetByName("Cultivos");
    const ubicacionesSheet = ss.getSheetByName("Ubicaciones");
    
    if (!actividadesSheet || !cultivosSheet || !ubicacionesSheet) {
      return { success: false, message: "Faltan hojas requeridas para el reporte" };
    }
    
    // Get Actividades_Cultivo data
    const actividadesLastRow = actividadesSheet.getLastRow();
    if (actividadesLastRow < 2) {
      return { success: true, data: [] };
    }
    
    const actividadesHeaders = actividadesSheet.getRange(1, 1, 1, actividadesSheet.getLastColumn()).getValues()[0];
    const actividadesData = actividadesSheet.getRange(2, 1, actividadesLastRow - 1, actividadesSheet.getLastColumn()).getValues();
    
    const idCultivoIdx = actividadesHeaders.indexOf("ID_Cultivo");
    const nombreActividadIdx = actividadesHeaders.indexOf("Nombre_Actividad");
    const fechaPlaneadaIdx = actividadesHeaders.indexOf("Fecha_Planeada");
    const tiempoRequeridoIdx = actividadesHeaders.indexOf("Tiempo_Requerido_Min");
    
    // Get Cultivos data
    const cultivosLastRow = cultivosSheet.getLastRow();
    const cultivosHeaders = cultivosSheet.getRange(1, 1, 1, cultivosSheet.getLastColumn()).getValues()[0];
    const cultivosData = cultivosLastRow >= 2 ? cultivosSheet.getRange(2, 1, cultivosLastRow - 1, cultivosSheet.getLastColumn()).getValues() : [];
    
    const cultivoIdIdx = cultivosHeaders.indexOf("ID");
    const cultivoUbicacionIdx = cultivosHeaders.indexOf("ID_Ubicacion");
    const cultivoVariedadIdx = cultivosHeaders.indexOf("ID_Variedad");
    
    // Create Cultivos lookup map
    const cultivosMap = {};
    for (let i = 0; i < cultivosData.length; i++) {
      const id = cultivosData[i][cultivoIdIdx];
      cultivosMap[id] = {
        idUbicacion: cultivosData[i][cultivoUbicacionIdx],
        idVariedad: cultivosData[i][cultivoVariedadIdx]
      };
    }
    
    // Get Ubicaciones data
    const ubicacionesLastRow = ubicacionesSheet.getLastRow();
    const ubicacionesHeaders = ubicacionesSheet.getRange(1, 1, 1, ubicacionesSheet.getLastColumn()).getValues()[0];
    const ubicacionesData = ubicacionesLastRow >= 2 ? ubicacionesSheet.getRange(2, 1, ubicacionesLastRow - 1, ubicacionesSheet.getLastColumn()).getValues() : [];
    
    const ubicacionIdIdx = ubicacionesHeaders.indexOf("ID");
    const ubicacionNombreIdx = ubicacionesHeaders.indexOf("Nombre_Cultivo");
    
    // Create Ubicaciones lookup map
    const ubicacionesMap = {};
    for (let i = 0; i < ubicacionesData.length; i++) {
      const id = ubicacionesData[i][ubicacionIdIdx];
      ubicacionesMap[id] = ubicacionesData[i][ubicacionNombreIdx] || 'Sin Ubicación';
    }
    
    // Process Actividades data and aggregate
    const aggregated = {};
    
    for (let i = 0; i < actividadesData.length; i++) {
      const idCultivo = actividadesData[i][idCultivoIdx];
      const nombreActividad = actividadesData[i][nombreActividadIdx] || 'Sin Nombre';
      const fechaPlaneadaRaw = actividadesData[i][fechaPlaneadaIdx];
      const tiempoRequeridoMin = Number(actividadesData[i][tiempoRequeridoIdx]) || 0;
      
      // Convert date using helper function
      const fechaPlaneada = toDate(fechaPlaneadaRaw);
      
      if (!idCultivo || !fechaPlaneada) {
        continue;
      }
      
      // Get cultivo info
      const cultivoInfo = cultivosMap[idCultivo];
      if (!cultivoInfo) continue;
      
      const idUbicacion = cultivoInfo.idUbicacion;
      const idVariedad = cultivoInfo.idVariedad;
      
      // Apply filters - ubicaciones
      if (filters.ubicaciones && filters.ubicaciones.length > 0 && !filters.ubicaciones.includes('ALL')) {
        if (!filters.ubicaciones.includes(idUbicacion)) {
          continue;
        }
      }
      
      // Apply filters - variedades
      if (filters.variedades && filters.variedades.length > 0 && !filters.variedades.includes('ALL')) {
        if (!filters.variedades.includes(idVariedad)) {
          continue;
        }
      }
      
      // Calculate week info
      const weekInfo = getWeekInfo(fechaPlaneada);
      if (!weekInfo) continue;
      
      // Apply week filter
      if (weekInfo.year !== filters.year) continue;
      if (weekInfo.week < filters.weekStart || weekInfo.week > filters.weekEnd) continue;
      
      // Get cultivo name
      const cultivoNombre = ubicacionesMap[idUbicacion] || 'Sin Ubicación';
      
      // Create aggregation key
      const key = weekInfo.week + '|' + cultivoNombre + '|' + nombreActividad;
      
      if (!aggregated[key]) {
        aggregated[key] = {
          weekNum: weekInfo.week,
          dateRange: weekInfo.dateRange,
          cultivo: cultivoNombre,
          actividad: nombreActividad,
          tiempoHoras: 0
        };
      }
      
      // Convert minutes to hours
      aggregated[key].tiempoHoras += tiempoRequeridoMin / 60;
    }
    
    // Convert to array and sort
    const result = Object.values(aggregated).sort((a, b) => {
      if (a.weekNum !== b.weekNum) return a.weekNum - b.weekNum;
      if (a.cultivo !== b.cultivo) return a.cultivo.localeCompare(b.cultivo);
      return a.actividad.localeCompare(b.actividad);
    });
    
    // Sanitize data to ensure proper serialization through postMessage
    const sanitizedResult = sanitizeReportData(result);
    
    return { success: true, data: sanitizedResult };
    
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

/**
 * Get materials forecast report grouped by week
 * @param {String} token - Auth token
 * @param {Object} filters - {year, weekStart, weekEnd, ubicaciones[], variedades[]}
 * @returns {Object} {success, data: [{weekNum, dateRange, cultivo, insumo, cantidadRequerida, costoEstimado}]}
 */
function getReportInsumos(token, filters) {
  try {
    _authRequire_(token);
    
    const ss = SpreadsheetApp.getActive();
    
    // Get all required sheets
    const insumosSheet = ss.getSheetByName("Insumos_Cultivo");
    const cultivosSheet = ss.getSheetByName("Cultivos");
    const ubicacionesSheet = ss.getSheetByName("Ubicaciones");
    
    if (!insumosSheet || !cultivosSheet || !ubicacionesSheet) {
      return { success: false, message: "Faltan hojas requeridas para el reporte" };
    }
    
    // Get Insumos_Cultivo data
    const insumosLastRow = insumosSheet.getLastRow();
    if (insumosLastRow < 2) {
      return { success: true, data: [] };
    }
    
    const insumosHeaders = insumosSheet.getRange(1, 1, 1, insumosSheet.getLastColumn()).getValues()[0];
    const insumosData = insumosSheet.getRange(2, 1, insumosLastRow - 1, insumosSheet.getLastColumn()).getValues();
    
    const idCultivoIdx = insumosHeaders.indexOf("ID_Cultivo");
    const nombreInsumoIdx = insumosHeaders.indexOf("Nombre_Insumo");
    const fechaPlaneadaIdx = insumosHeaders.indexOf("Fecha_Planeada");
    const cantidadRequeridaIdx = insumosHeaders.indexOf("Cantidad_Requerida");
    const costoEstimadoIdx = insumosHeaders.indexOf("Costo_Estimado");
    
    // Get Cultivos data
    const cultivosLastRow = cultivosSheet.getLastRow();
    const cultivosHeaders = cultivosSheet.getRange(1, 1, 1, cultivosSheet.getLastColumn()).getValues()[0];
    const cultivosData = cultivosLastRow >= 2 ? cultivosSheet.getRange(2, 1, cultivosLastRow - 1, cultivosSheet.getLastColumn()).getValues() : [];
    
    const cultivoIdIdx = cultivosHeaders.indexOf("ID");
    const cultivoUbicacionIdx = cultivosHeaders.indexOf("ID_Ubicacion");
    const cultivoVariedadIdx = cultivosHeaders.indexOf("ID_Variedad");
    
    // Create Cultivos lookup map
    const cultivosMap = {};
    for (let i = 0; i < cultivosData.length; i++) {
      const id = cultivosData[i][cultivoIdIdx];
      cultivosMap[id] = {
        idUbicacion: cultivosData[i][cultivoUbicacionIdx],
        idVariedad: cultivosData[i][cultivoVariedadIdx]
      };
    }
    
    // Get Ubicaciones data
    const ubicacionesLastRow = ubicacionesSheet.getLastRow();
    const ubicacionesHeaders = ubicacionesSheet.getRange(1, 1, 1, ubicacionesSheet.getLastColumn()).getValues()[0];
    const ubicacionesData = ubicacionesLastRow >= 2 ? ubicacionesSheet.getRange(2, 1, ubicacionesLastRow - 1, ubicacionesSheet.getLastColumn()).getValues() : [];
    
    const ubicacionIdIdx = ubicacionesHeaders.indexOf("ID");
    const ubicacionNombreIdx = ubicacionesHeaders.indexOf("Nombre_Cultivo");
    
    // Create Ubicaciones lookup map
    const ubicacionesMap = {};
    for (let i = 0; i < ubicacionesData.length; i++) {
      const id = ubicacionesData[i][ubicacionIdIdx];
      ubicacionesMap[id] = ubicacionesData[i][ubicacionNombreIdx] || 'Sin Ubicación';
    }
    
    // Process Insumos data and aggregate
    const aggregated = {};
    
    for (let i = 0; i < insumosData.length; i++) {
      const idCultivo = insumosData[i][idCultivoIdx];
      const nombreInsumo = insumosData[i][nombreInsumoIdx] || 'Sin Nombre';
      const fechaPlaneadaRaw = insumosData[i][fechaPlaneadaIdx];
      const cantidadRequerida = Number(insumosData[i][cantidadRequeridaIdx]) || 0;
      const costoEstimado = Number(insumosData[i][costoEstimadoIdx]) || 0;
      
      // Convert date using helper function
      const fechaPlaneada = toDate(fechaPlaneadaRaw);
      
      if (!idCultivo || !fechaPlaneada) {
        continue;
      }
      
      // Get cultivo info
      const cultivoInfo = cultivosMap[idCultivo];
      if (!cultivoInfo) continue;
      
      const idUbicacion = cultivoInfo.idUbicacion;
      const idVariedad = cultivoInfo.idVariedad;
      
      // Apply filters - ubicaciones
      if (filters.ubicaciones && filters.ubicaciones.length > 0 && !filters.ubicaciones.includes('ALL')) {
        if (!filters.ubicaciones.includes(idUbicacion)) {
          continue;
        }
      }
      
      // Apply filters - variedades
      if (filters.variedades && filters.variedades.length > 0 && !filters.variedades.includes('ALL')) {
        if (!filters.variedades.includes(idVariedad)) {
          continue;
        }
      }
      
      // Calculate week info
      const weekInfo = getWeekInfo(fechaPlaneada);
      if (!weekInfo) continue;
      
      // Apply week filter
      if (weekInfo.year !== filters.year) continue;
      if (weekInfo.week < filters.weekStart || weekInfo.week > filters.weekEnd) continue;
      
      // Get cultivo name
      const cultivoNombre = ubicacionesMap[idUbicacion] || 'Sin Ubicación';
      
      // Create aggregation key
      const key = weekInfo.week + '|' + cultivoNombre + '|' + nombreInsumo;
      
      if (!aggregated[key]) {
        aggregated[key] = {
          weekNum: weekInfo.week,
          dateRange: weekInfo.dateRange,
          cultivo: cultivoNombre,
          insumo: nombreInsumo,
          cantidadRequerida: 0,
          costoEstimado: 0
        };
      }
      
      aggregated[key].cantidadRequerida += cantidadRequerida;
      aggregated[key].costoEstimado += costoEstimado;
    }
    
    // Convert to array and sort
    const result = Object.values(aggregated).sort((a, b) => {
      if (a.weekNum !== b.weekNum) return a.weekNum - b.weekNum;
      if (a.cultivo !== b.cultivo) return a.cultivo.localeCompare(b.cultivo);
      return a.insumo.localeCompare(b.insumo);
    });
    
    // Sanitize data to ensure proper serialization through postMessage
    const sanitizedResult = sanitizeReportData(result);
    
    return { success: true, data: sanitizedResult };
    
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

/**
 * Get filter options for reports (ubicaciones and variedades)
 * @param {String} token - Auth token
 * @returns {Object} {success, ubicaciones: [{id, nombre}], variedades: [{id, nombre}]}
 */
function getReportFilterOptions(token) {
  try {
    _authRequire_(token);
    
    const ss = SpreadsheetApp.getActive();
    
    // Get Ubicaciones
    const ubicacionesSheet = ss.getSheetByName("Ubicaciones");
    const ubicaciones = [];
    
    if (ubicacionesSheet && ubicacionesSheet.getLastRow() >= 2) {
      const headers = ubicacionesSheet.getRange(1, 1, 1, ubicacionesSheet.getLastColumn()).getValues()[0];
      const data = ubicacionesSheet.getRange(2, 1, ubicacionesSheet.getLastRow() - 1, ubicacionesSheet.getLastColumn()).getValues();
      
      const idIdx = headers.indexOf("ID");
      const nombreIdx = headers.indexOf("Nombre_Cultivo");
      
      for (let i = 0; i < data.length; i++) {
        ubicaciones.push({
          id: data[i][idIdx],
          nombre: data[i][nombreIdx] || 'Sin Nombre'
        });
      }
    }
    
    // Get Variedades
    const variedadesSheet = ss.getSheetByName("Variedades");
    const variedades = [];
    
    if (variedadesSheet && variedadesSheet.getLastRow() >= 2) {
      const headers = variedadesSheet.getRange(1, 1, 1, variedadesSheet.getLastColumn()).getValues()[0];
      const data = variedadesSheet.getRange(2, 1, variedadesSheet.getLastRow() - 1, variedadesSheet.getLastColumn()).getValues();
      
      const idIdx = headers.indexOf("ID");
      const nombreIdx = headers.indexOf("Nombre");
      
      for (let i = 0; i < data.length; i++) {
        variedades.push({
          id: data[i][idIdx],
          nombre: data[i][nombreIdx] || 'Sin Nombre'
        });
      }
    }
    
    // Sanitize to ensure proper serialization
    return { 
      success: true, 
      ubicaciones: sanitizeReportData(ubicaciones), 
      variedades: sanitizeReportData(variedades) 
    };
    
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}
