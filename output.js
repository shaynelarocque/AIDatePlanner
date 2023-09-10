window.onload = function () {
    const imageUrl = sessionStorage.getItem('imageUrl');
    const datePlan = sessionStorage.getItem('datePlan');

    if (imageUrl) {
        const img = document.createElement('img');
        img.src = imageUrl;
        document.getElementById('image-output').appendChild(img);
    }

    if (datePlan) {
        document.getElementById("text-output").innerHTML = parseJSON(datePlan);
    }
    
    console.log('Fading out...');
    setTimeout(function() {
        let fadeContainer = document.getElementById('fade-container');
        fadeContainer.style.opacity = 0;
    }, 1000); // wait for 1 second after the page is loaded before starting the fade out

    const outputContent = document.getElementById('output-content');
    const totalHeight = outputContent.getBoundingClientRect().height;
    outputContent.style.setProperty('--totalHeight', `${totalHeight}px`);

    setTimeout(function() {
    console.log('Initiating print...');
    window.print();
    }, 5000); // wait for 5 seconds after the page is loaded before starting the print

    window.addEventListener("afterprint", (event) => {
        setTimeout(function() {
            //window.location.href = "index.html";
        }, 30000); // wait for 30 seconds after the print is done before redirecting
    });
}

function parseJSON(jsonString) {
    const data = JSON.parse(jsonString);
    let receiptHTML = `<section class="py-5 bg-white">
    <div class="container py-5 bg-white">`;
    receiptHTML += `<h2 class="text-center fs-2 fw-bold mb-4">Love-O-Meter Analysis</h2>`;
    receiptHTML += `<div class="row">`;
    
    // Define a map for better titles
    let titleMap = {
        "UserDesc": "AI Vision",
        "City": "City",
        "Theme": "The theme of the date is...",
        "Date": "Who you will meet...",
        "Outfit": "What you should wear...",
        "Time": "Save the date for...",
        "Meet": "You will meet them at...",
        "Activity1": "First Activity",
        "Restaurant": "Restaurant",
        "Order": "Order Recommendation",
        "Topics": "Conversational Topics",
        "Activity2": "Second Activity"
    }
    
    for (let key in data) {
        let title = titleMap[key] || key.replace(/_/g, ' ');
        receiptHTML += `<div class="col-6 mb-2">`;
        receiptHTML += `<label class="fw-bold mb-1">${title}</label>`;
        receiptHTML += `<span class="d-block p-1 bg-white border border-secondary rounded">${data[key]}</span>`;
        receiptHTML += `</div>`;
    }
    
    receiptHTML += `</div></div></section>`;
    return receiptHTML;
}