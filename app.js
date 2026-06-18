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

        document.getElementById("results").innerHTML =
            `<pre>${text}</pre>`;

    }
    catch (err) {

        console.error(err);

        document.getElementById("status").innerHTML =
            "Failed to read PDF";

    }

});
