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
            `PDF Loaded<br>
             Total Pages: ${pdf.numPages}`;

    }
    catch (err) {

        console.error(err);

        document.getElementById("status").innerHTML =
            "Failed to read PDF";
    }

});
