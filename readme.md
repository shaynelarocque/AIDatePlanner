# AI Date Planner Experiment

This project is a tongue-in-cheek modernization of old-school "Love-O-Meter" machines often found in penny arcades, created to explore the limits of social, political, and ethical acceptability in AI applications for public engagement. It explores how powerful AI in the future may seep into important life decisions; in this case, choosing a partner for one's self, commodified as an arcade machine.

It uses AI to create a unique date plan for the user. The application uses machine learning models to analyze a photo of the user, their location, and the current season to generate a plan that matches their look and location. The project makes use of OpenAI's ChatGPT, Google Maps API, Hugging Face's inference API, and your device's built-in camera. The frontend is built using HTML, CSS, and JavaScript (Featuring a Midjourney-generated image of a Love-O-Meter)

## Setup and Configuration

To setup the project on your local machine:

1. Clone the repository to your local machine.
2. Configure the API keys for Google Maps, OpenAI, and Hugging Face in the HTML file or in the input fields. 

### Input Configuration

The HTML file contains several form fields where you need to enter the following:

- **Google Maps API Key:** You can get this from the Google Cloud Platform. This is used for geolocation services to identify the user's current city.
- **OpenAI API Key:** You can get this from the OpenAI website. This is used to interact with the ChatGPT model of your choosing (`gpt-3.5-turbo` and `gpt-4` tested).
- **Huggingface API Key:** You can get this from the Hugging Face website. This is used to call image captioning model which analyzes the user's photo.
- **Huggingface Image Captioning Model:** This is the machine learning model used for analyzing the user's photo. The default model is `nlpconnect/vit-gpt2-image-captioning`.

## License

This project is licensed under the MIT License.
