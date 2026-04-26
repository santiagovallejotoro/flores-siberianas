# Changelog

## February 2026

### New Features

#### Production Reports System
- **New screen**: "Reportes de Producción" with three report tabs
- **Report 1 - Producción por Semana**: Weekly production forecast by Ubicación and Variedad
- **Report 2 - Mano de Obra**: Weekly labor hours by Cultivo and Actividad
- **Report 3 - Materiales**: Weekly material costs by Cultivo and Insumo
- **Filters**: Year, Week range, Month quick-select, Ubicaciones, Variedades
- **Week calculation**: ISO 8601 standard with date ranges (e.g., "3 Feb - 9 Feb")
- **Summary cards**: Totals, averages, peak week identification
- **PDF Export**: Print-to-PDF with professional formatting
- **Files**: `Code.gs` (612+ lines), `FarmPanel.html` (700+ lines)

### Bug Fixes

#### Reports Data Not Loading - Serialization Issue
- **Issue**: Report data existed in backend but UI showed empty reports
- **Cause**: Same as dropdown issue - Date objects and data fail to serialize through Google Apps Script's postMessage
- **Fix**: Added `sanitizeReportData()` function and applied to all report return values
- **Files**: `Code.gs`

#### Reports Using Wrong Variable Names
- **Issue**: Reports code used `window.authToken` and `showNotification()` which don't exist
- **Cause**: New reports code didn't match existing app patterns
- **Fix**: Changed to use `authToken` (local var) and `showToast()` (existing function)
- **Files**: `FarmPanel.html`

#### CSP Error with jsPDF Library
- **Issue**: Content Security Policy blocked jsPDF due to `eval()` usage
- **Fix**: Replaced jsPDF with native print-to-PDF using window.open() and styled HTML
- **Files**: `FarmPanel.html`

#### Variedades Form - Dropdown Options Not Loading
- **Issue**: "Tipo de Cultivo" and "Ubicación" selectors in Variedades form showed no options despite data existing in tables
- **Cause**: Date objects from spreadsheet cells failed to serialize properly through Google Apps Script's postMessage communication
- **Fix**: Added `sanitize()` function in `getDropdownData()` to convert Date objects to ISO strings and trim whitespace from property keys
- **Files**: `Code.gs`, `FarmPanel.html`

---

## January 2026

### New Features

#### Clases de Cultivo (Crop Classes)
- **New table**: `Clases_Cultivo` with columns: ID, Nombre, Fecha_Creacion, Descripcion
- **Default classes**: HORTENSIA, ROSA, CLAVEL
- **Sidebar access**: Configuración → Clases de Cultivo
- **Activities linked by ID**: `Actividades.ID_Clase_Cultivo` → `Clases_Cultivo.ID`

#### Activities by Crop Class
- **New screen**: "Actividades por Clase de Cultivo"
- **Dropdown filter**: Select a class to see/edit its activities
- **Inline table editing**: Edit multiple activities at once
- **Batch save**: Save all changes with one click
- **New activity modal**: Professional form to add activities

#### Production Cycles (Ciclos de Producción)
- **Auto-generation**: Based on `Ciclo_en_Semanas` and `Semana_Inicio_Corte`
- **Bell-curve distribution**: Automatic percentage assignment (sum = 100%)
- **Inline editing**: Compact table view for editing cycles
- **Validations**: 
  - Sum of percentages must equal 100%
  - Week numbers must be in ascending order

#### Variedades (Varieties)
- **New fields**: ID_Ubicacion, Ciclo_en_Semanas, Semana_Inicio_Corte
- **Renamed fields**: 
  - Ciclo_Semanas → Ciclo_en_Semanas
  - Rendimiento_Esperado → Rendimiento_Esperado_por_Planta
- **Buttons**: "Generar Ciclos" and "Editar Ciclos"
- **Cascade delete**: Deleting variety also deletes its cycles

### UI Improvements

#### Custom Confirmation Dialog
- Replaced browser `confirm()` with themed modal
- Returns Promise for async handling
- Types: warning, info

#### Duplicate Submission Prevention
- Submit buttons disable during API calls
- Loading spinner displayed
- Re-enabled on success/failure

#### Nueva Actividad Modal
- Professional form with all activity fields
- Auto-focus on name field
- Form validation

#### Table Compactness
- Reduced padding in Ciclos and Actividades tables
- Compact inputs for inline editing

### Bug Fixes

#### Fixed: `getTable()` return value handling
- **Issue**: Code checked `result.success` but `getTable()` returns `{ headers, rows }` without `success` field
- **Fixed in**: `cargarClasesDisponibles()`, `cargarActividadesClase()`, `cargarListaClases()`

#### Fixed: GAS variable conflict
- **Issue**: `SyntaxError: Identifier 'TABLE_DEFINITIONS' has already been declared`
- **Solution**: Renamed to `FARM_TABLE_DEFINITIONS` and used `var` instead of `const`

#### Fixed: Configuracion column alignment
- **Issue**: Data appearing in wrong columns
- **Solution**: Ensured all defaultData values are strings

### Default Data

#### HORTENSIA Activities (10 activities)
| Actividad | Semana | Categoría |
|-----------|--------|-----------|
| Siembra | 1 | Establecimiento |
| Riego | 0 | Mantenimiento |
| Fertilización | 0 | Mantenimiento |
| Control de Plagas | 0 | Mantenimiento |
| Poda de Formación | 4 | Mantenimiento |
| Deshoje | 6 | Mantenimiento |
| Tutorado | 5 | Mantenimiento |
| Desbotonado | 8 | Producción |
| Cosecha | 12 | Producción |
| Empaque | 12 | Postcosecha |

### Setup Commands

Run in Apps Script editor:

```javascript
// Create/update all tables
setupAllTables()

// Ensure crop classes have default data
ensureClasesCultivoData()

// Populate default HORTENSIA activities (if Actividades is empty)
populateDefaultActivities()
```

---

## File Changes Summary

### Code.gs
- Added `getClasesCultivo()` - reads from Clases_Cultivo table
- Added `actualizarActividadesBatch()` - batch update activities
- Deprecated `updateClasesCultivo()` - now uses standard CRUD

### tables.gs
- Added `Clases_Cultivo` table definition
- Updated `Actividades` column: `Clase_Cultivo` → `ID_Clase_Cultivo`
- Added `ensureClasesCultivoData()` function
- Added `ensureActividadesStructure()` function
- Added `populateDefaultActivities()` with 10 HORTENSIA activities

### FarmPanel.html
- Added "Clases de Cultivo" to sidebar (Configuración section)
- Added `nuevaActividadModal` for adding activities
- Fixed all `result.success` checks for `getTable()` calls
- Added inline table editing for activities
- Removed "Gestionar Clases" button from Actividades screen
- Renamed column "Tiempo (seg)" → "Tiempo (seg) por planta"
