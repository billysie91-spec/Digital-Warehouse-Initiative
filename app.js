// ============================================
// Configuration & Constants
// ============================================

const RECIPE_MAP = {
    "Fish with Garlic Bean Sauce": [
        "Fish\\Cube\\8-15g\\Cooked\\600g\\RED",
        "Sauce\\Garlic Bean\\Fz\\250G"
    ],
    "Fish with Hong Kong Soy Sauce": [
        "Fish\\Cube\\8-15g\\Cooked\\600g",
        "Sauce\\HK Soy\\FZ\\250G"
    ],
    "Garlic Soy Fish": [
        "Fish\\Cube\\8-15g\\Cooked\\600g",
        "Sauce\\Garlic soy\\Fz\\250G"
    ],
    "Mediterranean Fish": [
        "Fish\\Cube\\8-15g\\Cooked\\600g\\RED",
        "Sauce\\Mediterranean\\Fz\\250G"
    ],
    "Tangy Soy Fish": [
        "Fish\\Cube\\8-15g\\Cooked\\600g",
        "Sauce\\Tangy Soy\\Fz\\250G"
    ],
    "Teriyaki Baked Fish": [
        "Fish\\Cube\\8-15g\\Cooked\\600g\\RED",
        "Sauce\\Teriyaki\\FZ\\250g"
    ],
    "Sweet and Sour Fish": [
        "Fish\\Cube\\8-15g\\Cooked\\600g",
        "Sauce\\Sweet N Sour\\FZ\\250G"
    ],
    "Fish with Chinese Style Onion Sauce": [
        "Fish\\Cube\\8-15g\\Cooked\\600g\\RED",
        "Sauce\\Chinese Style Onion\\Fz\\250G"
    ],
    "Oriental Fish": [
        "Fish\\Cube\\8-15g\\Cooked\\600g",
        "Sauce\\Oriental Sweet\\FZ\\250g"
    ],
    "Kam Heong Fish": [
        "Fish\\Cube\\8-15g\\Cooked\\600g\\RED",
        "Sauce\\Kam Heong\\Fz\\250G"
    ]
};

const NORMALIZATION_RULES = {
    outlet: [
        { pattern: /LIMITED/g, replacement: "" },
        { pattern: /@/g, replacement: "" },
        { pattern: /\./g, replacement: "" },
        { pattern: /-/g, replacement: "" },
        { pattern: /[()]/g, replacement: "" },
        { pattern: /\s+/g, replacement: "" }
    ],
    address: [
        { pattern: /LIMITED/g, replacement: "" },
        { pattern: /BLK/g, replacement: "" },
        { pattern: /AVENUE/g, replacement: "AVE" },
        { pattern: /STREET/g, replacement: "ST" },
        { pattern: /ROAD/g, replacement: "RD" },
        { pattern: /SINGAPORE/g, replacement: "" },
        { pattern: /NORTH|SOUTH|EAST|WEST/g, replacement: "" },
        { pattern: /DELIVERY TO/g, replacement: "" },
        { pattern: /#/g, replacement: "" },
        { pattern: /,/g, replacement: "" },
        { pattern: /\(/g, replacement: "" },
        { pattern: /\)/g, replacement: "" },
        { pattern: /-/g, replacement: " " },
        { pattern: /\s+/g, replacement: " " }
    ]
};

const SPECIAL_LOCATION_MATCHES = [
    {
        check: (addr) => addr.includes("YISHUN AVE 11"),
        find: (x) => String(x["Centre Address"] || "").toUpperCase().includes("YISHUN AVE 11"),
        label: "YISHUN AVE 11"
    },
    {
        check: (addr) => addr.includes("YISHUN RING ROAD"),
        find: (x) => String(x["Centre Address"] || "").toUpperCase().includes("YISHUN RING ROAD"),
        label: "YISHUN RING ROAD"
    },
    {
        check: (addr) => addr.includes("991 UPPER JURONG ROAD"),
        find: (x) => String(x["Centre Address"] || "").toUpperCase().includes("991 UPPER JURONG ROAD"),
        label: "PIONEER (991 UPPER JURONG ROAD)"
    }
];

const DOM_ELEMENTS = {
    processBtn: null,
    exportBtn: null,
    masterFile: null,
    pdfFile: null,
    status: null,
    results: null
};

const VALIDATION = {
    MIN_PDF_BLOCK_LENGTH: 2,
    FILE_DATE_PATTERN: /(\d{2}_\d{2}_\d{4})/,
    MATERIAL_NO_PATTERN: /^\d{10}$/,
    OUTLET_PATTERNS: [
        /^(Blk|Bllk|lk)\s*/i,
        /^No\.?\s*/i,
        /^\d+[A-Z]?[,\s]/
    ],
    EXCLUSION_CODES: ["(CC)", "(DS)", "(EY)"]
};

// ============================================
// State Management
// ============================================

const state = {
    exportRows: [],
    pdfDate: "",
    addressMaster: [],
    isProcessing: false
};

// ============================================
// Utility Functions
// ============================================

/**
 * Log with context for debugging
 * @param {string} context - Context label
 * @param {any} data - Data to log
 */
function logDebug(context, data) {
    console.log(`[${context}]`, data);
}

/**
 * Log error with context
 * @param {string} context - Context label
 * @param {Error|string} error - Error object or message
 */
function logError(context, error) {
    console.error(`[ERROR ${context}]`, error instanceof Error ? error.message : error);
}

/**
 * Update UI status message
 * @param {string} message - Status message (supports HTML)
 * @param {string} type - 'info', 'success', 'error'
 */
function updateStatus(message, type = 'info') {
    if (!DOM_ELEMENTS.status) return;
    
    DOM_ELEMENTS.status.innerHTML = message;
    DOM_ELEMENTS.status.className = `status status-${type}`;
}

/**
 * Show user alert
 * @param {string} message - Alert message
 * @param {string} type - 'info', 'error', 'success'
 */
function showAlert(message, type = 'info') {
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
    alert(`${prefix} ${message}`);
}

/**
 * Validate DOM elements exist
 * @returns {boolean} True if all elements are available
 */
function validateDOMElements() {
    const elementsToCheck = ['processBtn', 'exportBtn', 'masterFile', 'pdfFile', 'status', 'results'];
    
    for (const el of elementsToCheck) {
        const element = document.getElementById(
            el === 'processBtn' ? 'processBtn' :
            el === 'exportBtn' ? 'exportBtn' :
            el === 'masterFile' ? 'masterFile' :
            el === 'pdfFile' ? 'pdfFile' :
            el === 'status' ? 'status' :
            el === 'results' ? 'results' : null
        );
        
        if (!element) {
            logError('DOM_VALIDATION', `Missing element: ${el}`);
            return false;
        }
        
        DOM_ELEMENTS[el] = element;
    }
    
    return true;
}

// ============================================
// Text Processing Utilities
// ============================================

/**
 * Normalize text using predefined rules
 * @param {string} text - Text to normalize
 * @param {string} type - 'outlet' or 'address'
 * @returns {string} Normalized text
 */
function normalize(text, type = "outlet") {
    if (!text) return "";
    
    let result = String(text).toUpperCase();
    const rules = NORMALIZATION_RULES[type] || NORMALIZATION_RULES.outlet;
    
    rules.forEach(({ pattern, replacement }) => {
        result = result.replace(pattern, replacement);
    });
    
    return result.trim();
}

/**
 * Extract block number from address text
 * @param {string} text - Address text
 * @returns {string} Block number or empty string
 */
function extractBlk(text) {
    if (!text) return "";
    
    const s = String(text).toUpperCase();
    
    const patterns = [
        /DELIVERY\s+GO\s+TO\s+BLK\s*(\d+[A-Z]?)/,
        /BLK\s*(\d+[A-Z]?)/,
        /^(\d+[A-Z]?)\s/,
        /^(\d+[A-Z]?),/
    ];
    
    for (const pattern of patterns) {
        const match = s.match(pattern);
        if (match) return match[1];
    }
    
    return "";
}

/**
 * Extract date from filename (DD_MM_YYYY format)
 * @param {string} fileName - File name
 * @returns {string} Date in DD.MM.YYYY format or empty string
 */
function extractDateFromFilename(fileName) {
    if (!fileName) return "";
    
    const match = fileName.match(VALIDATION.FILE_DATE_PATTERN);
    return match ? match[1].replace(/_/g, ".") : "";
}

/**
 * Validate file is PDF
 * @param {File} file - File to validate
 * @returns {boolean} True if file is PDF
 */
function isPdfFile(file) {
    return file && (file.type === 'application/pdf' || file.name.endsWith('.pdf'));
}

/**
 * Validate file is Excel
 * @param {File} file - File to validate
 * @returns {boolean} True if file is Excel
 */
function isExcelFile(file) {
    return file && (
        file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.type === 'application/vnd.ms-excel' ||
        file.name.endsWith('.xlsx') ||
        file.name.endsWith('.xls')
    );
}

// ============================================
// PDF Processing
// ============================================

/**
 * Check if line is an address start line
 * @param {string} line - Line to check
 * @returns {boolean} True if line appears to be address start
 */
function isAddressStartLine(line) {
    if (!line) return false;
    
    for (const pattern of VALIDATION.OUTLET_PATTERNS) {
        if (pattern.test(line)) return true;
    }
    
    return false;
}

/**
 * Extract outlet and address from block text
 * @param {string[]} block - Block of text lines
 * @returns {{outlet: string, address: string}} Extracted outlet and address
 */
function extractOutletAndAddress(block) {
    if (!Array.isArray(block) || block.length === 0) {
        return { outlet: "", address: "" };
    }
    
    for (let j = 0; j < block.length; j++) {
        if (isAddressStartLine(block[j])) {
            return {
                outlet: block.slice(0, j).join(" "),
                address: block.slice(j).join(" ")
            };
        }
    }
    
    return { outlet: "", address: "" };
}

/**
 * Extract PO and Ship-To blocks from PDF lines
 * @param {string[]} lines - PDF text lines
 * @returns {string[]} Block of text between PO and Ship-To
 */
function extractPoToShipBlock(lines) {
    if (!Array.isArray(lines)) return [];
    
    const poIndex = lines.findIndex(x => x && x.includes("Customer PO No"));
    const shipIndex = lines.findIndex(x => x && x.includes("Ship To Code"));
    
    if (poIndex < 0 || shipIndex < 0) {
        logDebug('PDF_EXTRACTION', `PO Index: ${poIndex}, Ship Index: ${shipIndex}`);
        return [];
    }
    
    const block = lines.slice(poIndex + 1, shipIndex);
    return block.length >= VALIDATION.MIN_PDF_BLOCK_LENGTH ? block : [];
}

/**
 * Parse PDF page and extract row data
 * @param {Object} page - PDF page object
 * @returns {Promise<Array>} Array of row data
 */
async function parsePdfPage(page) {
    try {
        const textContent = await page.getTextContent();
        
        if (!textContent || !Array.isArray(textContent.items)) {
            logError('PDF_PARSING', 'Invalid text content structure');
            return [];
        }
        
        const text = textContent.items
            .map(i => i.str || "")
            .join("\n");
        
        const lines = text
            .split("\n")
            .map(x => x.trim())
            .filter(x => x);
        
        const block = extractPoToShipBlock(lines);
        if (block.length === 0) return [];
        
        const { outlet, address } = extractOutletAndAddress(block);
        
        if (!outlet || !address) {
            logDebug('PDF_EXTRACTION', 'Empty outlet or address');
            return [];
        }
        
        return [{
            outlet,
            address,
            rawText: text
        }];
    } catch (error) {
        logError('PDF_PAGE_PARSING', error);
        return [];
    }
}

// ============================================
// Address Matching
// ============================================

/**
 * Find matching addresses from master list
 * @param {string} outletName - Outlet name from PDF
 * @returns {Array} Matching address records
 */
function findCandidates(outletName) {
    if (!outletName || state.addressMaster.length === 0) return [];
    
    const pdfName = normalize(outletName);
    
    return state.addressMaster.filter(x => {
        const masterName = normalize(x["Centre Name"] || "");
        return masterName.includes(pdfName) || pdfName.includes(masterName);
    });
}

/**
 * Match address with special rules for known locations
 * @param {Array} candidates - Candidate addresses
 * @param {string} pdfAddress - Address from PDF
 * @returns {Object} Matched address record or null
 */
function matchAddress(candidates, pdfAddress) {
    if (!Array.isArray(candidates) || candidates.length === 0) return null;
    if (candidates.length === 1) return candidates[0];
    
    const pdfAddressUpper = String(pdfAddress || "").toUpperCase();
    
    // Try special location matches
    for (const { check, find, label } of SPECIAL_LOCATION_MATCHES) {
        if (check(pdfAddressUpper)) {
            const match = candidates.find(find);
            if (match) {
                logDebug('ADDRESS_MATCH', `Special match found: ${label}`);
                return match;
            }
        }
    }
    
    // Fall back to block number matching
    const pdfBlk = extractBlk(pdfAddress);
    if (pdfBlk) {
        const matched = candidates.find(x => extractBlk(x["Centre Address"] || "") === pdfBlk);
        if (matched) {
            logDebug('ADDRESS_MATCH', `Block number match: ${pdfBlk}`);
            return matched;
        }
    }
    
    // Default to first candidate
    logDebug('ADDRESS_MATCH', 'Using first candidate as fallback');
    return candidates[0];
}

// ============================================
// HTML Generation
// ============================================

/**
 * Generate HTML table header
 * @returns {string} HTML table header
 */
function generateTableHeader() {
    return `
        <table border="1" cellpadding="5" style="width: 100%; border-collapse: collapse;">
        <thead>
            <tr style="background-color: #f0f0f0;">
                <th style="padding: 10px;">Outlet</th>
                <th style="padding: 10px;">Address</th>
                <th style="padding: 10px;">Description</th>
                <th style="padding: 10px;">Qty</th>
                <th style="padding: 10px;">UOM</th>
            </tr>
        </thead>
        <tbody>
    `;
}

/**
 * Generate HTML table row
 * @param {Object} outlet - Outlet data
 * @param {Object} matched - Matched address record
 * @param {string} description - Item description
 * @param {string} qty - Quantity
 * @param {string} uom - Unit of measure
 * @returns {string} HTML table row
 */
function generateTableRow(outlet, matched, description, qty, uom) {
    const address = matched ? matched["Centre Address"] : outlet.address;
    
    return `
        <tr>
            <td style="padding: 8px;">${escapeHtml(outlet.outlet)}</td>
            <td style="padding: 8px;">${escapeHtml(address)}</td>
            <td style="padding: 8px;">${escapeHtml(description)}</td>
            <td style="padding: 8px; text-align: center;">${escapeHtml(qty)}</td>
            <td style="padding: 8px;">${escapeHtml(uom)}</td>
        </tr>
    `;
}

/**
 * Escape HTML special characters
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Create export row object
 * @param {Object} outlet - Outlet data
 * @param {Object} matched - Matched address record
 * @param {string} description - Item description
 * @param {string} qty - Quantity
 * @param {string} uom - Unit of measure
 * @returns {Object} Export row object
 */
function createExportRow(outlet, matched, description, qty, uom) {
    const outletName = String(outlet.outlet || "")
        .replace(/limited/gi, "")
        .replace(/\s+/g, " ")
        .trim();
    
    return {
        Outlet: matched ? matched["Centre Name"] : outletName,
        Address: matched ? matched["Centre Address"] : outlet.address,
        Description: description,
        Qty: qty || 0,
        UOM: uom || ""
    };
}

// ============================================
// Item Processing
// ============================================

/**
 * Process recipe item
 * @param {Object} outlet - Outlet data
 * @param {string} description - Item description
 * @param {string} qty - Quantity
 * @param {string} uom - Unit of measure
 * @returns {string} HTML rows
 */
function processRecipeItem(outlet, description, qty, uom) {
    const candidates = findCandidates(outlet.outlet);
    const matched = matchAddress(candidates, outlet.address);
    
    const recipeItems = RECIPE_MAP[description] || [];
    let html = "";
    
    recipeItems.forEach(item => {
        html += generateTableRow(outlet, matched, item, qty, uom);
        state.exportRows.push(createExportRow(outlet, matched, item, qty, uom));
    });
    
    return html;
}

/**
 * Process non-recipe item
 * @param {Object} outlet - Outlet data
 * @param {string} description - Item description
 * @param {string} qty - Quantity
 * @param {string} uom - Unit of measure
 * @returns {string} HTML row
 */
function processRegularItem(outlet, description, qty, uom) {
    const candidates = findCandidates(outlet.outlet);
    const matched = matchAddress(candidates, outlet.address);
    
    const html = generateTableRow(outlet, matched, description, qty, uom);
    state.exportRows.push(createExportRow(outlet, matched, description, qty, uom));
    
    return html;
}

/**
 * Extract material items from raw PDF text
 * @param {string} rawText - Raw PDF text
 * @returns {Array} Array of extracted items
 */
function extractMaterialItems(rawText) {
    if (!rawText) return [];
    
    const lines = rawText.split("\n")
        .map(x => x.trim())
        .filter(x => x);
    
    const items = [];
    
    for (let i = 0; i < lines.length; i++) {
        if (!VALIDATION.MATERIAL_NO_PATTERN.test(lines[i])) continue;
        
        const materialNo = lines[i];
        const description = lines[i + 1] || "";
        const qty = lines[i + 3] || "";
        const uom = lines[i + 4] || "";
        
        if (description && qty) {
            items.push({ materialNo, description, qty, uom });
        }
    }
    
    return items;
}

/**
 * Extract and process items from raw text
 * @param {Object} outlet - Outlet data
 * @returns {string} HTML rows
 */
function extractAndProcessItems(outlet) {
    const items = extractMaterialItems(outlet.rawText);
    let html = "";
    
    for (const { description, qty, uom } of items) {
        logDebug('ITEM_PROCESSING', `Description: ${description}, Qty: ${qty}`);
        
        if (RECIPE_MAP[description]) {
            html += processRecipeItem(outlet, description, qty, uom);
        } else {
            html += processRegularItem(outlet, description, qty, uom);
        }
    }
    
    return html;
}

// ============================================
// Excel Export
// ============================================

/**
 * Validate export data
 * @returns {boolean} True if data is valid
 */
function validateExportData() {
    if (!Array.isArray(state.exportRows) || state.exportRows.length === 0) {
        showAlert("Please process PDF first before exporting", "error");
        return false;
    }
    
    // Validate each row has required fields
    for (const row of state.exportRows) {
        if (!row.Outlet || !row.Description) {
            logError('EXPORT_VALIDATION', `Invalid row: ${JSON.stringify(row)}`);
            showAlert("Invalid data found in export rows", "error");
            return false;
        }
    }
    
    return true;
}

/**
 * Generate summary data from export rows
 * @returns {Array} Summary rows with totals by description
 */
function generateSummary() {
    const summary = {};
    
    state.exportRows.forEach(r => {
        const desc = r.Description || "Unknown";
        if (!summary[desc]) {
            summary[desc] = 0;
        }
        summary[desc] += Number(r.Qty) || 0;
    });
    
    return Object.keys(summary).map(k => ({
        Description: k,
        TotalQty: summary[k]
    }));
}

/**
 * Export data to Excel workbook
 */
function exportToExcel() {
    if (!validateExportData()) return;
    
    try {
        if (typeof XLSX === 'undefined') {
            throw new Error('XLSX library not loaded. Please include the library script.');
        }
        
        const ws = XLSX.utils.json_to_sheet(state.exportRows);
        const wsSummary = XLSX.utils.json_to_sheet(generateSummary());
        
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "NTUC DO");
        XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");
        
        // Set column widths
        ws['!cols'] = [
            { wch: 20 },
            { wch: 30 },
            { wch: 40 },
            { wch: 10 },
            { wch: 10 }
        ];
        
        const fileName = state.pdfDate
            ? `NTUC_DO-${state.pdfDate}.xlsx`
            : "NTUC_DO.xlsx";
        
        XLSX.writeFile(wb, fileName);
        showAlert(`File exported successfully: ${fileName}`, "success");
        logDebug('EXPORT', `File exported: ${fileName}`);
    } catch (error) {
        logError('EXPORT', error);
        showAlert(`Export failed: ${error.message}`, "error");
    }
}

// ============================================
// Event Handlers
// ============================================

/**
 * Handle PDF processing
 */
async function handlePdfProcessing() {
    const file = DOM_ELEMENTS.pdfFile.files[0];
    
    if (!file) {
        showAlert("Please select a PDF file", "error");
        return;
    }
    
    if (!isPdfFile(file)) {
        showAlert("Please select a valid PDF file", "error");
        return;
    }
    
    // Prevent duplicate processing
    if (state.isProcessing) {
        showAlert("PDF is already being processed. Please wait.", "error");
        return;
    }
    
    state.isProcessing = true;
    state.pdfDate = extractDateFromFilename(file.name);
    state.exportRows = [];
    
    updateStatus("Reading PDF...", "info");
    
    try {
        if (typeof pdfjsLib === 'undefined') {
            throw new Error('PDF.js library not loaded. Please include the library script.');
        }
        
        const buffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
        
        if (!pdf || !pdf.numPages) {
            throw new Error('Invalid PDF file or unable to read pages');
        }
        
        updateStatus(`PDF Loaded<br>Total Pages: ${pdf.numPages}`, "info");
        logDebug('PDF_LOADED', `Pages: ${pdf.numPages}`);
        
        let rows = [];
        
        for (let p = 1; p <= pdf.numPages; p++) {
            try {
                const page = await pdf.getPage(p);
                const pageRows = await parsePdfPage(page);
                rows.push(...pageRows);
            } catch (pageError) {
                logError(`PDF_PAGE_${p}`, pageError);
            }
        }
        
        if (rows.length === 0) {
            updateStatus("No valid data found in PDF", "error");
            showAlert("No valid order data found in the PDF file", "error");
            state.isProcessing = false;
            return;
        }
        
        let html = generateTableHeader();
        
        rows.forEach(outlet => {
            html += extractAndProcessItems(outlet);
        });
        
        html += "</tbody></table>";
        
        DOM_ELEMENTS.results.innerHTML = html;
        updateStatus(`✅ Processing Complete<br>Found ${state.exportRows.length} items`, "success");
        logDebug('PROCESSING_COMPLETE', `Items: ${state.exportRows.length}`);
    }
    catch (err) {
        logError('PDF_PROCESSING', err);
        updateStatus(`❌ Failed to read PDF: ${err.message}`, "error");
        showAlert(`Error processing PDF: ${err.message}`, "error");
    }
    finally {
        state.isProcessing = false;
    }
}

/**
 * Handle master file upload
 */
async function handleMasterFileUpload(e) {
    const file = e.target.files[0];
    
    if (!file) return;
    
    if (!isExcelFile(file)) {
        showAlert("Please select a valid Excel file", "error");
        return;
    }
    
    try {
        if (typeof XLSX === 'undefined') {
            throw new Error('XLSX library not loaded. Please include the library script.');
        }
        
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data);
        
        if (!workbook || !workbook.SheetNames || workbook.SheetNames.length === 0) {
            throw new Error('Invalid Excel file or no sheets found');
        }
        
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(sheet);
        
        if (!Array.isArray(jsonData) || jsonData.length === 0) {
            throw new Error('No data found in Excel sheet');
        }
        
        // Validate required columns
        const requiredColumns = ['Centre Name', 'Centre Address'];
        const firstRow = jsonData[0];
        
        for (const col of requiredColumns) {
            if (!(col in firstRow)) {
                throw new Error(`Missing required column: "${col}"`);
            }
        }
        
        state.addressMaster = jsonData;
        logDebug('MASTER_LOADED', `Loaded ${state.addressMaster.length} records`);
        showAlert(`Master file loaded: ${state.addressMaster.length} centres`, "success");
    }
    catch (err) {
        logError('MASTER_FILE_UPLOAD', err);
        showAlert(`Failed to load master file: ${err.message}`, "error");
        state.addressMaster = [];
    }
}

// ============================================
// Initialization
// ============================================

/**
 * Initialize application
 */
function initializeApp() {
    try {
        if (!validateDOMElements()) {
            throw new Error('Required DOM elements not found');
        }
        
        // Attach event listeners
        DOM_ELEMENTS.processBtn.addEventListener("click", handlePdfProcessing);
        DOM_ELEMENTS.exportBtn.addEventListener("click", exportToExcel);
        DOM_ELEMENTS.masterFile.addEventListener("change", handleMasterFileUpload);
        
        logDebug('APP_INIT', 'Application initialized successfully');
        updateStatus("Ready. Upload master file and PDF to begin.", "success");
    } catch (error) {
        logError('APP_INITIALIZATION', error);
        console.error('Failed to initialize application:', error);
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}
