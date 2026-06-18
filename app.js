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

        const page =
            await pdf.getPage(1);

        const textContent =
            await page.getTextContent();

        const text =
            textContent.items
                .map(i => i.str)
                .join("\n");

        document.getElementById("status").innerHTML =
            `PDF Loaded<br>Total Pages: ${pdf.numPages}`;

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

let outlet = "";
let address = "";

if (poIndex >= 0 && shipIndex > poIndex) {

    const block =
        lines.slice(poIndex + 1, shipIndex);

    outlet = block[0] || "";

    address =
        block.slice(1).join(" ");
}

document.getElementById("results").innerHTML =
`
<h3>Outlet</h3>
${outlet}

<h3>Address</h3>
${address}
`;        

    }
    catch (err) {

        console.error(err);

        document.getElementById("status").innerHTML =
            "Failed to read PDF";

    }

});
