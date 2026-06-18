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
    address,
    rawText: text
});
}

document.getElementById("results").innerHTML =
    "<pre>" +
    rows[0].rawText +
    "</pre>";
    }
    catch (err) {

        console.error(err);

        document.getElementById("status").innerHTML =
            "Failed to read PDF";

    }

});
