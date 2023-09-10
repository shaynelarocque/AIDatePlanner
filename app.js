function getCurrentSeason() {
    const date = new Date();
    const month = date.getMonth();
    console.log('Current month:', month);

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

let running = false;

async function launch() {
    const season = getCurrentSeason();
    console.log('Current season:', season);

    if (running) {
        console.log('The launch function is already running.');
        return;
    }
    running = true;

    try {
        const hf = new HfInference(
            document.getElementById("token").value.trim() || undefined
        );

        const model = document.getElementById("model").value.trim();
        let canvas = document.getElementById('canvas');
        let video = document.getElementById('video');

        // draw image from video feed to canvas
        let context = canvas.getContext('2d');
        context.drawImage(video, 0, 0, 640, 480);

        canvas.toBlob(async function (blob) {
            let file = new File([blob], "webcam-photo.png", { type: 'image/png', lastModified: Date.now() });
            document.getElementById("logs").textContent = "";

            const { generated_text: user_description } = await hf.imageToText({ model, data: file });
            console.log('Image to text result: ', user_description);

            console.log('Generating image edit...');
            let chatGPTAPIKey = document.getElementById('chatgpt-api-key').value.trim();
            console.log('Chat GPT API Key: ', chatGPTAPIKey);

            const maskResponse = await fetch('./assets/mask.png');
            let maskBlob = await maskResponse.blob();

            const formData = new FormData();
            formData.append("image", blob, "webcam-photo.png");
            formData.append("prompt", "pink clouds, hearts, love, rainbow, pastel colors, god rays, in the style of van gogh");
            formData.append("mask", maskBlob, "mask.png"); // Append the mask blob
            formData.append("n", "1");
            formData.append("size", "256x256");
            const imageEditResponse = await fetch('https://api.openai.com/v1/images/edits', {
                method: 'POST',
                headers: { "Authorization": `Bearer ${chatGPTAPIKey}` },
                body: formData
            });
            const imageEditData = await imageEditResponse.json();
            console.log('Image edit data: ', imageEditData);
            if (imageEditData.data && imageEditData.data[0] && imageEditData.data[0].url) {
                // Add the new image to your web page
                const img = document.createElement('img');
                img.src = imageEditData.data[0].url;
                document.getElementById('image-output').appendChild(img);
            }

            if (imageEditData.data && imageEditData.data[0] && imageEditData.data[0].url) {
                // Store the image URL in session storage
                sessionStorage.setItem('imageUrl', imageEditData.data[0].url);
            }

            const googleMapsAPIKey = document.getElementById("googlemaps-api-key").value.trim();
            console.log('Google Maps API Key: ', googleMapsAPIKey);

            let city = "Unknown City Name, operate on vague assumptions";

            // Fetching geolocation data
            console.log('Fetching geolocation data...')
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(async function (position) {
                    const { latitude, longitude } = position.coords;

                    // Fetch city from Google Maps API
                    const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${googleMapsAPIKey}`);
                    const data = await response.json();

                    for (let component of data.results[0].address_components) {
                        if (component.types.includes("locality")) {
                            city = component.long_name;
                            console.log('Current city:', city);
                            break;
                        }
                    }

                    // OpenAI GPT API Call
                    console.log('Calling OpenAI GPT API...')
                    const chatResponse = await fetch("https://api.openai.com/v1/chat/completions", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${chatGPTAPIKey}`
                        },
                        body: JSON.stringify({
                            model: 'gpt-4',
                            messages: [
                                {
                                    role: 'system',
                                    content: `You are an advanced AI that specializes in tailoring a full date plan for the user. Based on the following context, generate a JSON response containing the date plan.`
                                },
                                {
                                    role: 'user',
                                    content: `
                Context:
                1. User Description: "${user_description}". This is a picture-based description of the user. Augment this description in a more flattering and detailed manner for the "User Desc" field.
                2. Current Location: "${city}". Provide a short, insightful description of this city for the "City" field.
                3. Current Season: "${season}". Use this information for planning the date.
                
                JSON Fields:
                1. "UserDesc": A more detailed and complimentary version of "${user_description}".
                2. "City": "${city}" Just the name, nothing else.
                3. "Theme": Choose a theme that matches the user's description, current season, and city. It doesn't have to be traditionally romantic—it could be silly, adventurous, whimsical, zany, creative, lighthearted, mischievous, anything.
                4. "Date": A description of the person they will meet, and where. Be vague but creative.
                5. "Outfit": A comprehensive description of what the user should wear, appropriate to the chosen theme and season.
                6. "Time": The ideal time for the date to occur.
                7. "Meet": The perfect meeting spot for the date.
                8. "Activity1": The first fun or exciting activity before heading to the restaurant.
                9. "Restaurant": The restaurant for the date, suitable for the theme and city.
                10. "Order": A single string of recommendations for an appetizer, 2 drinks, 2 meals, and 2 more drinks.
                11. "Topics": Suggested conversational topics for the date.
                12. "Activity2": An enjoyable activity for after the restaurant visit.
                
                Note: Please remember that the user's description, the city, and the current season should influence your choices.`
                                }],
                            temperature: 1.0,
                            top_p: 0.7,
                            n: 1,
                            stream: false,
                            presence_penalty: 0,
                            frequency_penalty: 0
                        })
                    });

                    const chatData = await chatResponse.json();
                    console.log('OpenAI GPT API Call Result: ', chatData);

                    if (chatData['choices'] && chatData['choices'][0] && chatData['choices'][0]['message']) {
                        const datePlan = chatData['choices'][0]['message']['content'];
                        console.log('Date plan: ', datePlan);
                        document.getElementById("logs").textContent = datePlan;
                        document.getElementById("output").innerHTML = parseJSON(datePlan);
                    }

                    if (chatData['choices'] && chatData['choices'][0] && chatData['choices'][0]['message']) {
                        const datePlan = chatData['choices'][0]['message']['content'];
                        // Store the date plan in session storage
                        sessionStorage.setItem('datePlan', datePlan);
                    }

                    if (sessionStorage.getItem('imageUrl') && sessionStorage.getItem('datePlan')) {
                        window.location.href = 'output.html'; // Redirect only when all data is stored in session storage
                        console.log('Redirecting to output page...');
                    }

                }, function () {
                    console.log("Geolocation is not supported by this browser.");
                });
            } else {
                console.log("Geolocation is not supported by this browser.");
            }
        }, 'image/png');


    } catch (err) {
        alert("Error: " + err.message);
    } finally {
        running = false;
    }
}

document.addEventListener("keydown", function (event) {
    if (event.key === "g" || event.key === "G") {
        console.log('Launching by "G" key press.');
        let fadeContainer = document.getElementById("fade-container");
        fadeContainer.style.opacity = 1;
        launch();
    }
    if (event.key === "p" || event.key === "P") {
        console.log('Showing form...');
        document.getElementById("secret-form").style.display = "block"; // show form
        document.getElementById("close-button").style.display = "block"; // show close button
    }
});

document.getElementById("close-button").addEventListener("click", function () {
    console.log('Hiding form...');
    document.getElementById("secret-form").style.display = "none"; // hide form
    this.style.display = "none"; // hide close button
});

window.launch = launch;