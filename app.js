let exportRows = [];

const recipeMap = {

    "Fish with Garlic Bean Sauce": [
        "Fish\\Cube\\8-15g\\Cooked\\600g\\RED",
        "Sauce\\Garlic Bean\\Fz\\250G"
    ],

    "Garlic Soy Fish": [
        "Fish\\Cube\\8-15g\\Cooked\\600g",
        "Sauce\\Garlic soy\\Fz\\250G"
    ],
    
    "Tangy Soy Fish": [
        "Fish\\Cube\\8-15g\\Cooked\\600g",
        "Sauce\\Tangy Soy\\Fz\\250G"
    ]
};

let addressMaster = [];


function normalizeOutlet(text) {

    return String(text || "")
        .toUpperCase()
        .replace(/LIMITED/g, "")
        .replace(/[@]/g, "")
        .replace(/[.]/g, "")
        .replace(/[-]/g, "")
        .replace(/[()]/g, "")
        .replace(/\s+/g, "")
        .trim();

}

function normalizeAddress(text) {

    return String(text || "")
        .toUpperCase()
        .replace(/LIMITED/g, "")
        .replace(/BLK/g, "")
        .replace(/AVENUE/g, "AVE")
        .replace(/STREET/g, "ST")
        .replace(/ROAD/g, "RD")
        .replace(/SINGAPORE/g, "")
        .replace(/NORTH|SOUTH|EAST|WEST/g, "")
        .replace(/DELIVERY TO/g, "")
        .replace(/#/g, "")
        .replace(/,/g, "")
        .replace(/\(/g, "")
        .replace(/\)/g, "")
        .replace(/-/g, " ")
        .replace(/\s+/g, " ")
        .trim();

}

function extractBlk(text) {

    const s =
        String(text || "")
        .toUpperCase();

    let m =
        s.match(/DELIVERY\s+GO\s+TO\s+BLK\s*(\d+[A-Z]?)/);

    if (m) {
        return m[1];
    }

    m =
        s.match(/BLK\s*(\d+[A-Z]?)/);

    if (m) {
        return m[1];
    }

    m =
        s.match(/^(\d+[A-Z]?)\s/);

    if (m) {
        return m[1];
    }

    m =
        s.match(/^(\d+[A-Z]?),/);

    if (m) {
        return m[1];
    }

    return "";
}

document.getElementById("processBtn").addEventListener("click", async () => {

    const file =
        document.getElementById("pdfFile").files[0];

    if (!file) {
        alert("Please select a PDF file");
        return;
    }

    document.getElementById("status").innerHTML =
        "Reading PDF...";

    try {

        const buffer =
            await file.arrayBuffer();

        const pdf =
            await pdfjsLib.getDocument({
                data: buffer
            }).promise;

document.getElementById("status").innerHTML =
    `PDF Loaded<br>Total Pages: ${pdf.numPages}`;

let rows = [];

exportRows = [];
        
for (let p = 1; p <= pdf.numPages; p++) {

    const page =
        await pdf.getPage(p);

    const textContent =
        await page.getTextContent();
    
    console.log(
    "PAGE",
    p,
    "TEXT ITEMS",
    textContent.items.length
);

    const text =
        textContent.items
            .map(i => i.str)
            .join("\n");

    const lines = text
        .split("\n")
        .map(x => x.trim())
        .filter(x => x);

    const poIndex =
        lines.findIndex(x =>
            x.includes("Customer PO No"));

    const shipIndex =
        lines.findIndex(x =>
            x.includes("Ship To Code"));

    if (poIndex < 0 || shipIndex < 0)
        continue;

    const block =
        lines.slice(poIndex + 1, shipIndex);

    if (block.length < 2)
        continue;

let outlet = "";
let address = "";

for (let j = 0; j < block.length; j++) {

if (
    (
        /^(Blk|Bllk|lk)\s*/i.test(block[j]) ||
        /^No\.?\s*/i.test(block[j]) ||
        /^\d+[A-Z]?[,\s]/.test(block[j])
    ) &&
    !block[j].includes("(CC)") &&
    !block[j].includes("(DS)") &&
    !block[j].includes("(EY)")
) {
        outlet =
            block.slice(0, j).join(" ");

        address =
            block.slice(j).join(" ");

        break;
    }
}

console.log("BLOCK:", block);

rows.push({
    outlet,
    address,
    rawText: text
});

  console.log(
    "ROW:",
    outlet,
    address
);
    
}

let html = `
<table border="1" cellpadding="5">
<tr>
<th>Outlet</th>
<th>Address</th>
<th>Description</th>
<th>Qty</th>
<th>UOM</th>
</tr>
`;

rows.forEach(r => {

    const lines =
        r.rawText.split("\n")
        .map(x => x.trim())
        .filter(x => x);

    for (let i = 0; i < lines.length; i++) {

        if (/^\d{10}$/.test(lines[i])) {

            const materialNo = lines[i];
            const description = lines[i + 1] || "";
            const qty = lines[i + 3] || "";
            const uom = lines[i + 4] || "";

            console.log(
    "ITEM:",
    description,
    "QTY:",
    qty,
    "OUTLET:",
    r.outlet,
    "ADDRESS:",
    r.address
);

if (recipeMap[description]) {

    recipeMap[description].forEach(item => {

const outletName =
String(r.outlet)
    .replace(/limited/gi, "")
    .trim()
    .toLowerCase()

const candidates =
    addressMaster.filter(x => {

        const masterName =
            normalizeOutlet(
                x["Centre Name"]
            );

        const pdfName =
    normalizeOutlet(
        r.outlet
    );

console.log(
    "PDF OUTLET:",
    r.outlet
);

console.log(
    "PDF NORMALIZED:",
    pdfName
);
        
        return (
            masterName === pdfName ||
            masterName.startsWith(pdfName)
        );

    });
        
console.log(
    "Candidates Count:",
    candidates.length
);
        
let matched = null;

if (candidates.length === 1) {

    matched = candidates[0];

}
else if (candidates.length > 1) {
    
    const pdfAddress =
    String(r.address || "")
        .toUpperCase();

if (
    pdfAddress.includes("YISHUN AVE 11")
) {

    matched =
        candidates.find(x =>
            String(x["Centre Address"] || "")
                .toUpperCase()
                .includes("YISHUN AVE 11")
        );

}
else if (
    pdfAddress.includes("YISHUN RING ROAD")
) {

    matched =
        candidates.find(x =>
            String(x["Centre Address"] || "")
                .toUpperCase()
                .includes("YISHUN RING ROAD")
        );

}

if (pdfAddress.includes("991 UPPER JURONG ROAD")) {

    console.log("PIONEER SPECIAL MATCH");

    matched =
        candidates.find(x =>
            String(x["Centre Address"] || "")
                .toUpperCase()
                .includes("991 UPPER JURONG ROAD")
        );

}
    
const pdfBlk =
    extractBlk(r.address);

if (!matched) {
    
matched =
    candidates.find(x => {

        const masterBlk =
            extractBlk(
                x["Centre Address"]
            );

        return masterBlk === pdfBlk;

    });

    if (!matched) {
        matched = candidates[0];
        }
    }
}
      
        html += `
        <tr>
            <td>${r.outlet}</td>
            <td>${matched ? matched["Centre Address"] : r.address}</td>
            <td>${item}</td>
            <td>${qty}</td>
            <td>${uom}</td>
        </tr>
        `;

exportRows.push({
    Outlet: matched
    ? matched["Centre Name"]
    : String(r.outlet)
        .replace(/limited/gi, "")
        .replace(/\s+/g, " ")
        .trim(),

    Address: matched
        ? matched["Centre Address"]
        : r.address,

    Description: item,
    Qty: qty,
    UOM: uom
});

    });
} else {

const outletName =
String(r.outlet)
    .replace(/limited/gi, "")
    .trim()
    .toLowerCase()

const candidates =
    addressMaster.filter(x => {

        const masterName =
            normalizeOutlet(
                x["Centre Name"]
            );

        const pdfName =
            normalizeOutlet(
                r.outlet
            );

        return (
            masterName === pdfName ||
            masterName.startsWith(pdfName)
        );

    });

let matched = null;

if (candidates.length === 1) {

    matched = candidates[0];

}
    
else if (candidates.length > 1) {

    const pdfBlk =
        extractBlk(r.address);

    if (!matched) {

        matched =
            candidates.find(x => {

                const masterBlk =
                    extractBlk(
                        x["Centre Address"]
                    );

                return masterBlk === pdfBlk;

            });

    }

    if (!matched) {
        matched = candidates[0];
    }
}
    
console.log(
    "PDF ADDRESS:",
    r.address,
    "MATCHED:",
    matched
        ? matched["Centre Address"]
        : "NONE"
);
    
exportRows.push({
    Outlet: matched
    ? matched["Centre Name"]
    : String(r.outlet)
        .replace(/limited/gi, "")
        .replace(/\s+/g, " ")
        .trim(),

    Address: matched
        ? matched["Centre Address"]
        : r.address,

    Description: description,
    Qty: qty,
    UOM: uom
});

    html += `
    <tr>
        <td>${r.outlet}</td>
        <td>${matched ? matched["Centre Address"] : r.address}</td>
        <td>${description}</td>
        <td>${qty}</td>
        <td>${uom}</td>
    </tr>
    `;
}
        }
    }
});

html += "</table>";

document.getElementById("results").innerHTML =
    html;
    }
    catch (err) {

        console.error(err);

        document.getElementById("status").innerHTML =
            "Failed to read PDF";

    }

});
document.getElementById("exportBtn")
.addEventListener("click", () => {

    if (exportRows.length === 0) {
        alert("Please process PDF first");
        return;
    }

    const ws =
        XLSX.utils.json_to_sheet(exportRows);

    const wb =
        XLSX.utils.book_new();

    const summary = {};

exportRows.forEach(r => {

    if (!summary[r.Description]) {
        summary[r.Description] = 0;
    }

    summary[r.Description] +=
        Number(r.Qty) || 0;

});

const summaryRows =
    Object.keys(summary).map(k => ({
        Description: k,
        TotalQty: summary[k]
    }));

const wsSummary =
    XLSX.utils.json_to_sheet(summaryRows);
    
    XLSX.utils.book_append_sheet(
        wb,
        ws,
        "NTUC DO"
    );

    XLSX.utils.book_append_sheet(
    wb,
    wsSummary,
    "Summary"
);
    
console.table(exportRows.slice(-20));
    
    XLSX.writeFile(
        wb,
        "NTUC_DO.xlsx"
    );

});

document
.getElementById("masterFile")
.addEventListener("change", async (e) => {

    const file = e.target.files[0];

    if (!file) return;

    const data =
        await file.arrayBuffer();

    const workbook =
        XLSX.read(data);

    const sheet =
        workbook.Sheets[
            workbook.SheetNames[0]
        ];

addressMaster =
    XLSX.utils.sheet_to_json(sheet);

console.log(
    "Address Master Loaded:",
    addressMaster.length
);

});
