# 🌱 Farm Manager - Sistema de Gestión Agrícola

## Overview

Farm Manager is a web application built on **Google Apps Script** for managing agricultural operations. It uses Google Sheets as a database and provides a modern, responsive UI.

## Tech Stack

| Component | Technology |
|-----------|------------|
| **Backend** | Google Apps Script (GAS) |
| **Frontend** | HTML + CSS + JavaScript |
| **Database** | Google Sheets |
| **Icons** | Lucide Icons |
| **Styling** | Custom CSS (Tailwind-inspired) |
| **Deployment** | Apps Script Web App |

## File Structure

```
farm/
├── Code.gs         # Backend logic, CRUD operations, business logic
├── FarmPanel.html  # Frontend UI (HTML + CSS + JS all-in-one)
├── tables.gs       # Table definitions, schema, setup functions
├── README.md       # This file
└── CHANGELOG.md    # Recent changes
```

## Architecture

### Data Flow

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  FarmPanel.html │────▶│    Code.gs      │────▶│  Google Sheets  │
│   (Frontend)    │◀────│   (Backend)     │◀────│   (Database)    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### Authentication Flow

```
1. User enters username/password
2. Frontend calls login(user, pass)
3. Backend validates against Usuarios sheet
4. If valid: generates token, stores in CacheService (6h TTL)
5. Token returned to frontend, stored in sessionStorage
6. All subsequent API calls include token for validation
```

### API Pattern

All backend functions follow this pattern:
```javascript
function functionName(token, param1, param2) {
  _authRequire_(token);  // Validate token
  // ... business logic
  return { success: true, data: ... } or { success: false, message: "..." }
}
```

**Exception**: `getTable()` returns `{ headers: [], rows: [] }` without `success` field.

## Database Schema (Google Sheets)

### Core Tables

| Sheet | Purpose | Key Columns |
|-------|---------|-------------|
| **Configuracion** | System settings | Variable, Valor, Descripción |
| **Usuarios** | User accounts | ID, Nombre, Clave, Role |
| **Clases_Cultivo** | Crop class catalog | ID, Nombre, Fecha_Creacion, Descripcion |
| **Variedades** | Crop varieties | ID, Nombre, ID_Ubicacion, Ciclo_en_Semanas |
| **Actividades** | Activities catalog | ID, ID_Clase_Cultivo, Nombre_Actividad, Semana_Actividad |
| **Ubicaciones** | Locations | ID, Nombre, Area_Hectareas, Tipo |
| **Insumos** | Supplies/inputs | ID, Nombre, Categoria, Stock_Actual |

### Operational Tables

| Sheet | Purpose |
|-------|---------|
| **Cultivos** | Active crop instances |
| **Ciclo_Produccion** | Production cycle stages per variety |
| **Costos** | Cost records |
| **Produccion** | Production records |
| **Mano_Obra** | Labor records |
| **Ventas** | Sales records |

### Key Relationships

```
Clases_Cultivo (1) ──────< (N) Actividades
       │
       └── ID_Clase_Cultivo (foreign key)

Variedades (1) ──────< (N) Ciclo_Produccion
       │
       └── ID_Variedad (foreign key)

Ubicaciones (1) ──────< (N) Variedades
       │
       └── ID_Ubicacion (foreign key)
```

## Backend Functions (Code.gs)

### Authentication
- `login(user, pass)` - Authenticate user
- `logout(token)` - Invalidate session
- `_authRequire_(token)` - Internal: validate token

### Generic CRUD
- `getTable(token, sheetName)` - Get all data from sheet
- `addRow(token, sheetName, data)` - Insert new row
- `updateRow(token, sheetName, rowId, data)` - Update existing row
- `deleteRow(token, sheetName, rowId)` - Delete row

### Configuration
- `_getConfigValue_(varName)` - Get config variable value
- `getDropdownData(token)` - Get all dropdown options

### Specialized Functions
- `generarCiclosProduccion(token, variedadId)` - Auto-generate production cycles
- `getCiclosProduccion(token, variedadId)` - Get cycles for variety
- `actualizarCiclosBatch(token, updates)` - Batch update cycles
- `deleteCiclosProduccion(token, variedadId)` - Delete cycles for variety
- `actualizarActividadesBatch(token, updates)` - Batch update activities
- `getClasesCultivo()` - Get crop classes as array of objects

## Frontend Structure (FarmPanel.html)

### Screens (div.screen)
- `loginScreen` - Login form
- `dashboardScreen` - Main dashboard with stats
- `tableEditorScreen` - Generic table editor
- `cultivoEditorScreen` - Crop editor
- `ciclosProduccionScreen` - Production cycles editor
- `actividadesPorClaseScreen` - Activities by class editor

### Modals
- `rowEditorModal` - Edit single row
- `nuevoCultivoModal` - New crop
- `costoModal`, `produccionModal`, `laborModal` - Quick entry forms
- `nuevaActividadModal` - New activity form
- `clasesModal` - Manage crop classes
- `confirmDialog` - Custom confirmation dialog

### Key JavaScript Functions

```javascript
// Navigation
switchScreen(screenId)
openTableEditor(tableName)

// CRUD
loadTableData(tableName)
saveRowData()
deleteCurrentRow()

// Specialized
abrirActividadesPorClase()
cargarClasesDisponibles()
cargarActividadesClase(claseId)
guardarTodasActividades()

abrirCiclosProduccion()
cargarCiclosVariedad(variedadId)
guardarTodosCiclos()

// UI Helpers
showModal(modalId)
hideModal(modalId)
showToast(message)
showConfirm(message, title, type) // Returns Promise
```

## Setup & Deployment

### Initial Setup

1. Create new Google Spreadsheet
2. Open Apps Script (Extensions > Apps Script)
3. Create files: `Code.gs`, `FarmPanel.html`, `tables.gs`
4. Copy code into each file
5. Run `setupAllTables()` to create all sheets with default data

### Setup Functions (tables.gs)

```javascript
setupAllTables()           // Create/update all sheets
ensureClasesCultivoData()  // Ensure crop classes exist
populateDefaultActivities() // Add default HORTENSIA activities
```

### Deploy as Web App

1. Deploy > New deployment
2. Type: Web app
3. Execute as: Me
4. Who has access: Anyone (or specific users)
5. Copy web app URL

## UI/UX Patterns

### Custom Confirmation Dialog
```javascript
const confirmed = await showConfirm(
  "¿Eliminar este registro?",
  "Confirmar eliminación",
  "warning" // or "info"
);
if (confirmed) { /* proceed */ }
```

### Button Loading State
```javascript
btn.disabled = true;
btn.classList.add('loading');
// ... async operation
btn.disabled = false;
btn.classList.remove('loading');
```

### Toast Notifications
```javascript
showToast('Operación exitosa');
showToast('Error: ' + message);
```

## Special Features

### 1. Production Cycles Auto-Generation
- User sets `Ciclo_en_Semanas` and `Semana_Inicio_Corte` in variety
- System generates N cycles with bell-curve percentage distribution
- Percentages sum to 100%

### 2. Activities by Crop Class
- Activities organized by `Clases_Cultivo` (HORTENSIA, ROSA, etc.)
- Inline table editing with batch save
- Filters activities by selected class

### 3. Cascade Deletes
- Deleting a Variedad also deletes its Ciclo_Produccion records

### 4. Duplicate Submission Prevention
- Submit buttons disable and show spinner during API calls
- Re-enable on success or failure

## Development Guidelines

### Adding a New Table

1. Add definition in `tables.gs` → `FARM_TABLE_DEFINITIONS`
2. Run `setupAllTables()` to create sheet
3. Table automatically works with generic CRUD

### Adding a New Screen

1. Add HTML in FarmPanel.html:
```html
<div id="myScreen" class="screen">
  <div class="content-header">...</div>
  <div class="content-body">...</div>
</div>
```

2. Add navigation button in sidebar
3. Add JavaScript functions for screen logic

### CSS Classes

| Class | Purpose |
|-------|---------|
| `.screen` | Screen container |
| `.card` | Card container |
| `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-danger` | Buttons |
| `.input-field` | Input styling |
| `.form-label`, `.form-group` | Form elements |
| `.data-table` | Table styling |
| `.modal-overlay`, `.modal-content` | Modal styling |
| `.loading-container`, `.spinner` | Loading states |
| `.empty-state` | Empty state with icon |

## Common Patterns

### Fetching Table Data
```javascript
google.script.run
  .withSuccessHandler(result => {
    // result = { headers: [...], rows: [...] }
    if (result.rows.length > 0) {
      // process data
    }
  })
  .withFailureHandler(err => {
    showToast('Error: ' + err.message);
  })
  .getTable(authToken, 'TableName');
```

### Adding a Row
```javascript
google.script.run
  .withSuccessHandler(result => {
    if (result.success) {
      showToast('Agregado');
    } else {
      showToast(result.message);
    }
  })
  .addRow(authToken, 'TableName', { field1: 'value1', ... });
```

### Batch Updates
```javascript
const updates = rows.map(row => ({
  id: row.id,
  data: { field1: newValue, ... }
}));

google.script.run
  .withSuccessHandler(result => {
    showToast(`${result.updated} registros actualizados`);
  })
  .actualizarCiclosBatch(authToken, updates);
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Token inválido" | Session expired, re-login |
| Table not loading | Check sheet exists, run `setupAllTables()` |
| Dropdown empty | Check foreign key table has data |
| Styles not updating | Clear browser cache, hard refresh |
| GAS variable conflict | Use `var` instead of `const` for globals |

## Performance Notes

- Avoid reading entire sheets for simple lookups
- Use batch operations when updating multiple rows
- CacheService used for auth tokens (faster than PropertiesService)
- Date objects converted to strings for JSON serialization

---

**Last Updated:** January 2026
