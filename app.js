document.getElementById("processBtn").addEventListener("click", () => {

    const file =
        document.getElementById("pdfFile").files[0];

    if (!file) {

        alert("Please select a PDF file");

        return;
    }

    document.getElementById("status").innerHTML =
        "PDF selected:<br>" + file.name;

});
