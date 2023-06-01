function getCurrentSeason() {
    const date = new Date();
    const month = date.getMonth();

    if (month < 2 || month === 11) {
        return "Winter";
    } else if (month < 5) {
        return "Spring";
    } else if (month < 8) {
        return "Summer";
    } else {
        return "Fall";
    }
}

function parseJSON(jsonString) {
    const data = JSON.parse(jsonString);
    let receiptHTML = `<section class="py-20 bg-white">
    <div class="max-w-5xl mx-auto py-16 bg-white">`;
    receiptHTML += `<h2 class="text-4xl font-bold mb-4 text-center">AI Date Plan</h2>`;
    receiptHTML += `<div class="flex flex-wrap -mx-2">`;

    for (let key in data) {
        receiptHTML += `<div class="w-full sm:w-1/2 md:w-1/3 px-2 mb-4">`;
        receiptHTML += `<label class="block mb-1 font-bold">${key.replace(/_/g, ' ')}</label>`;
        receiptHTML += `<span class="block p-2 bg-gray-100 rounded">${data[key]}</span>`;
        receiptHTML += `</div>`;
    }

    receiptHTML += `</div></div></section>`;
    return receiptHTML;
}

import { HfInference } from "https://cdn.jsdelivr.net/npm/@huggingface/inference@1.8.0/+esm";

let video = document.getElementById('video');

// Access user's webcam if the browser supports it
if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia({ video: true }).then(function (stream) {
        video.srcObject = stream;
        video.play();
    });
}

// Capturing image from video stream on button click
document.getElementById("snap").addEventListener("click", function () {
    let canvas = document.getElementById('canvas');
    let context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, 640, 480);
});

let running = false;

async function launch() {
    const season = getCurrentSeason();
    
    if (running) {
        return;
    }
    running = true;
    
    try {
        const hf = new HfInference(
            document.getElementById("token").value.trim() || undefined
        );
        
        const model = document.getElementById("model").value.trim();
        let canvas = document.getElementById('canvas');
        
        canvas.toBlob(async function (blob) {
            let file = new File([blob], "webcam-photo.png", { type: 'image/png', lastModified: Date.now() });
            document.getElementById("logs").textContent = "";
            
            const { user_description } = await hf.imageToText({ model, data: file });
            
            const googleMapsAPIKey = document.getElementById("googlemaps-api-key").value.trim();
            const chatGPTAPIKey = document.getElementById("chatgpt-api-key").value.trim();
            
            let city = "Unknown City Name, operate on vague assumptions";
            
            // Fetching geolocation data
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(async function (position) {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;
                    
                    const locationResponse = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${googleMapsAPIKey}`);
                    const locationData = await locationResponse.json();
                    
                    // Parsing city name from location data
                    if (locationData.results[0]) {
                        for (let i = 0; i < locationData.results[0].address_components.length; i++) {
                            if (locationData.results[0].address_components[i].types.indexOf("locality") > -1) {
                                city = locationData.results[0].address_components[i].long_name;
                                break;
                            }
                        }
                    }

                    // Making API request to generate date plan
                    const chatResponse = await fetch('https://api.openai.com/v1/chat/completions', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${chatGPTAPIKey}`
                        },
                        body: JSON.stringify({
                            model: 'gpt-3.5-turbo',
                            messages: [
                                {
                                    role: 'user',
                                    content: `You are an advanced AI that specializes in tailoring a full date plan for the user. Based on the following context, generate a JSON response containing the date plan.

                                    Context:
                                    1. User Description: "${user_description}".
                                    2. Current Location: "${city}".
                                    3. Current Season: "${season}".
                                    
                                    JSON Fields:
                                    1. "UserDesc": A more detailed and complimentary version of "${user_description}".
                                    2. "City": "${city}" Just the name, nothing else.
                                    3. "Theme": Choose a theme that matches the user's description, current season, and city.
                                    4. "Date": A description of the person they will meet, and where.
                                    5. "Outfit": A comprehensive description of what the user should wear, appropriate to the chosen theme and season.
                                    6. "Time": The ideal time for the date to occur.
                                    7. "Meet": The perfect meeting spot for the date.
                                    8. "Activity1": The first fun or exciting activity before heading to the restaurant.
                                    9. "Restaurant": The restaurant for the date, suitable for the theme and city.
                                    10. "Order": Recommendations for 2 meals and drinks that they should order at the restaurant.
                                    11. "Topics": Suggested conversational topics for the date.
                                    12. "Activity2": An enjoyable activity for after the restaurant visit.
                                    13. "SeeAgain": Will there be a second date? Provide this information in "Y/N" format ONLY.
                                    `
                                }
                            ],
                            temperature: 1.0,
                            top_p: 0.7,
                            n: 1,
                            stream: false,
                            presence_penalty: 0,
                            frequency_penalty: 0,
                        })
                    });

                    // Displaying generated date plan
                    const chatData = await chatResponse.json();
                    document.getElementById("logs").textContent = JSON.stringify(chatData['choices'][0]['message']['content'].trim(), null, 2);
                    document.getElementById("output").innerHTML = parseJSON(chatData['choices'][0]['message']['content'].trim());
                });
            }

        }, 'image/png');

    } catch (err) {
        alert("Error: " + err.message);
    } finally {
        running = false;
    }
}

window.launch = launch;
