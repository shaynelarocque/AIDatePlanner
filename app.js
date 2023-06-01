// Function that calculates and returns the current season based on the current month.
function getCurrentSeason() {
    // Create a new Date object.
    const date = new Date();
    // Get the current month as a number (0-11).
    const month = date.getMonth();
    // Return the current season based on the month.
    // Months 0-1 and 11 are considered Winter.
    // Months 2-4 are considered Spring.
    // Months 5-7 are considered Summer.
    // Months 8-10 are considered Fall.
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

// Function that takes a JSON string, parses it and converts it into an HTML structure.
function parseJSON(jsonString) {
    // Parse the JSON string into a JavaScript object.
    const data = JSON.parse(jsonString);

    // Construct the initial HTML string.
    // The main structure consists of several nested divs, a header, and a div for the JSON fields.
    let receiptHTML = `<section class="py-20 bg-white">
    <div class="max-w-5xl mx-auto py-16 bg-white">`;

    // Add a header to the HTML string.
    receiptHTML += `<h2 class="text-4xl font-bold mb-4 text-center">AI Date Plan</h2>`;

    // Start a new div to contain the JSON fields.
    receiptHTML += `<div class="flex flex-wrap -mx-2">`;

    // Iterate over each key in the data object.
    for (let key in data) {
        // Add each JSON field as a labeled span inside a div.
        receiptHTML += `<div class="w-full sm:w-1/2 md:w-1/3 px-2 mb-4">`;
        receiptHTML += `<label class="block mb-1 font-bold">${key.replace(/_/g, ' ')}</label>`;
        receiptHTML += `<span class="block p-2 bg-gray-100 rounded">${data[key]}</span>`;
        receiptHTML += `</div>`;
    }

    // Close the div for the JSON fields and the rest of the initial HTML structure.
    receiptHTML += `</div></div></section>`;

    // Return the constructed HTML string.
    return receiptHTML;
}

// Import the HfInference class from HuggingFace's Inference package. 
import { HfInference } from "https://cdn.jsdelivr.net/npm/@huggingface/inference@1.8.0/+esm";

// Grab the video element from the DOM.
let video = document.getElementById('video');

// Check if the browser supports media devices and if it can access user media.
// If it does, get the user's media stream with video and play it on the video element.
if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia({ video: true }).then(function (stream) {
        video.srcObject = stream;
        video.play();
    });
}

// Add a click event listener on the "snap" button. 
// When clicked, it will grab the 'canvas' element and the 2D context, then draw the image from the video stream onto the canvas.
document.getElementById("snap").addEventListener("click", function () {
    let canvas = document.getElementById('canvas');
    let context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, 640, 480);
});

// State variable to control whether the launch function is currently running.
let running = false;

// Main function that conducts the process of user description creation, geolocation fetching, 
// Google Maps API call for city name, and OpenAI API call for date plan generation.
async function launch() {
    // Fetch the current season.
    const season = getCurrentSeason();
    
    // If the function is already running, exit the function early to prevent multiple executions.
    if (running) {
        return;
    }
    running = true;
    
    try {
        // Initialize an instance of the HfInference class with a token value or undefined if the token is not provided.
        const hf = new HfInference(
            document.getElementById("token").value.trim() || undefined
        );
        
        // Get the model name from the DOM.
        const model = document.getElementById("model").value.trim();
        
        // Grab the 'canvas' element from the DOM.
        let canvas = document.getElementById('canvas');
        
        // Convert the canvas image to a blob, to be sent to the HfInference class.
        canvas.toBlob(async function (blob) {
            // Create a new File from the blob and name it "webcam-photo.png".
            let file = new File([blob], "webcam-photo.png", { type: 'image/png', lastModified: Date.now() });
            
            // Clear out the "logs" text content.
            document.getElementById("logs").textContent = "";
            
            // Use the HfInference class to convert the image to text.
            const { user_description } = await hf.imageToText({ model, data: file });
            
            // Get the Google Maps and ChatGPT API keys from the DOM.
            const googleMapsAPIKey = document.getElementById("googlemaps-api-key").value.trim();
            const chatGPTAPIKey = document.getElementById("chatgpt-api-key").value.trim();
            
            // Initialize the city name with a default value.
            let city = "Unknown City Name, operate on vague assumptions";
            
            // Check if geolocation is available.
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(async function (position) {
                    // Get the latitude and longitude from the position object.
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;
                    
                    // Use the Google Maps API to get the location data from the latitude and longitude.
                    const locationResponse = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${googleMapsAPIKey}`);
                    const locationData = await locationResponse.json();
                    
                    // Parse the location data to get the city name.
                    if (locationData.results[0]) {
                        for (let i = 0; i < locationData.results[0].address_components.length; i++) {
                            if (locationData.results[0].address_components[i].types.indexOf("locality") > -1) {
                                city = locationData.results[0].address_components[i].long_name;
                                break;
                            }
                        }
                    }

                    // Make a POST request to the OpenAI ChatGPT API to generate a date plan based on the user's description, city, and the current season.
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
                                    1. User Description: "${user_description}". This is a picture-based description of the user. Augment this description in a more flattering and detailed manner for the "User Desc" field.
                                    2. Current Location: "${city}". Provide a short, insightful description of this city for the "City" field.
                                    3. Current Season: "${season}". Use this information for planning the date.
                                    
                                    JSON Fields:
                                    1. "UserDesc": A more detailed and complimentary version of "${user_description}".
                                    2. "City": "${city}" Just the name, nothing else.
                                    3. "Theme": Choose a theme that matches the user's description, current season, and city. It doesn't have to be traditionally romantic—it could be fun, adventurous, or even whimsical.
                                    4. "Date": A description of the person they will meet, and where. Be vague but creative.
                                    5. "Outfit": A comprehensive description of what the user should wear, appropriate to the chosen theme and season.
                                    6. "Time": The ideal time for the date to occur.
                                    7. "Meet": The perfect meeting spot for the date.
                                    8. "Activity1": The first fun or exciting activity before heading to the restaurant.
                                    9. "Restaurant": The restaurant for the date, suitable for the theme and city.
                                    10. "Order": Recommendations for 2 meals and drinks that they should order at the restaurant.
                                    11. "Topics": Suggested conversational topics for the date.
                                    12. "Activity2": An enjoyable activity for after the restaurant visit.
                                    13. "SeeAgain": Will there be a second date? Provide this information in "Y/N" format ONLY.
                                    
                                    Note: Please remember that the user's description, the city, and the current season should influence your choices.
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

                    // Parse the response from the API and log the result to the "logs" element.
                    // Then, use the parseJSON function to display the result in a human-readable format.
                    const chatData = await chatResponse.json();
                    document.getElementById("logs").textContent = JSON.stringify(chatData['choices'][0]['message']['content'].trim(), null, 2);
                    document.getElementById("output").innerHTML = parseJSON(chatData['choices'][0]['message']['content'].trim());
                });
            }

        }, 'image/png');

    } catch (err) {
        // If any error occurs, alert the error message.
        alert("Error: " + err.message);
    } finally {
        // After the operation is complete, reset the running variable to false.
        running = false;
    }
}

// Attach the launch function to the global window object so it can be invoked from anywhere in the code.
window.launch = launch;
