let exportRows = [];

const recipeMap = {

    "Fish with Garlic Bean Sauce": [
        "Fish\\Cube\\8-15g\\Cooked\\600g",
        "Sauce\\Garlic Soy\\FZ\\250G"
    ],

    "Tangy Soy Fish": [
        "Fish\\Cube\\8-15g\\Cooked\\600g",
        "Sauce\\Tangy Soy\\Fz\\250G"
    ]
};

let addressMaster = [];

function normalizeAddress(text) {

    return text
        .toUpperCase()
        .replace(/BLK/g, "")
        .replace(/STREET/g, "ST")
        .replace(/AVENUE/g, "AVE")
        .replace(/ROAD/g, "RD")
        .replace(/SINGAPORE\s+\d+/g, "")
        .replace(/#/g, "")
        .replace(/,/g, "")
        .replace(/\s+/g, " ")
        .trim();

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
            /^Blk\s+/i.test(block[j]) ||
            /^No\.\s*/i.test(block[j])
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

    rows.push({
    outlet,
    address,
    rawText: text
});

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

if (recipeMap[description]) {

    recipeMap[description].forEach(item => {

const outletName =
    String(r.outlet || "")
        .trim();

const matched =
    outletName
        ? addressMaster.find(x =>
            String(x["Recipient Name"] || "")
                .trim()
                .toLowerCase() ===
            outletName.toLowerCase()
          )
        : null;

console.log(
    "PDF:",
    r.outlet,
    "MATCH:",
    matched
);

        html += `
        <tr>
            <td>${r.outlet}</td>
            <td>${matched ? matched["Delivery Address"] : r.address}</td>
            <td>${item}</td>
            <td>${qty}</td>
            <td>${uom}</td>
        </tr>
        `;

        exportRows.push({
            Outlet: r.outlet,
            Address: matched
                ? matched["Delivery Address"]
                : r.address,
            PostalCode: matched
                ? matched["Postal Code"]
                : "",
            Description: item,
            Qty: qty,
            UOM: uom
        });

    });

} else {

const outletName =
    String(r.outlet || "")
        .trim();

const matched =
    outletName
        ? addressMaster.find(x =>
            String(x["Recipient Name"] || "")
                .trim()
                .toLowerCase() ===
            outletName.toLowerCase()
          )
        : null;

    exportRows.push({
        Outlet: r.outlet,
        Address: matched
            ? matched["Delivery Address"]
            : r.address,
        PostalCode: matched
            ? matched["Postal Code"]
            : "",
        Description: description,
        Qty: qty,
        UOM: uom
    });

    html += `
    <tr>
        <td>${r.outlet}</td>
        <td>${matched ? matched["Delivery Address"] : r.address}</td>
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

console.table(addressMaster);

console.log(
    "Address Master Loaded:",
    addressMaster.length
);

});
