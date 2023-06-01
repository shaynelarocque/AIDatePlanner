# AI Date Planner Experiment

The AI Date Planner project originated as an experimental AI-based tool for the AI Edge Cases research project under Technoculture, Art, and Games (TAG) institute at Concordia University.

This project is an embodiment of probing the limits of social, political, and ethical acceptability in AI applications for public engagement. It explores how AI may seep into important life decision-making, in this case, choosing a partner, in a manner that is simple and rich for the user.

It uses artificial intelligence to create a unique date plan for the user. The application uses machine learning models to analyze a photo of the user, their location, and the current season to generate a plan that matches their look and location. The project makes use of OpenAI's GPT-3.5-turbo, Google Maps API, Hugging Face's inference API, and your device's built-in camera. The frontend is built using HTML, CSS, and JavaScript.

## Setup and Configuration

To setup the project on your local machine:

1. Clone the repository to your local machine.
2. Configure the API keys for Google Maps, OpenAI, and Hugging Face in the HTML file or in the input fields. 

### Input Configuration

The HTML file contains several form fields where you need to enter the following:

- **Google Maps API Key:** You can get this from the Google Cloud Platform. This is used for geolocation services to identify the user's current city.
- **OpenAI API Key:** You can get this from the OpenAI website. This is used to interact with the GPT-3 model.
- **Huggingface API Key:** You can get this from the Hugging Face website. This is used to analyze the user's photo.
- **Huggingface Image Captioning Model:** This is the machine learning model used for analyzing the user's photo. The default model is `nlpconnect/vit-gpt2-image-captioning`.

## License

This project is licensed under the MIT License.
