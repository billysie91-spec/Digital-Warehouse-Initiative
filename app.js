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

let rows = [];

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

    let outlet = block[0];

    let address =
        block.slice(1).join(" ");

    rows.push({
        outlet,
        address
    });
}

let html = `
<table border="1" cellpadding="5">
<tr>
<th>#</th>
<th>Outlet</th>
<th>Address</th>
</tr>
`;

rows.forEach((r, i) => {

    html += `
    <tr>
        <td>${i + 1}</td>
        <td>${r.outlet}</td>
        <td>${r.address}</td>
    </tr>
    `;
});

html += "</table>";

document.getElementById("results").innerHTML =
    html;
