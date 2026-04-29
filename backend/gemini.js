import Groq from "groq-sdk";

const groqResponse = async (command, assistantName, userName) => {
  try {
    const client = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });

    const prompt = `You are a virtual assistant named ${assistantName} created by ${userName}. 
You are not Google. You will now behave like a voice-enabled assistant.

Your task is to understand the user's natural language input and respond with a JSON object like this:

{
  "type": "general" | "google-search" | "youtube-search" | "youtube-play" | "get-time" | "get-date" | "get-day" | "get-month" | "calculator-open" | "instagram-open" | "facebook-open" | "weather-show" | "open-app" | "get-weather" | "get-news" | "whatsapp-message",
  "userInput": "<original user input>",
  "response": "<a short spoken response to read out loud to the user>",
  "url": "<the full URL to open in browser, or null if not needed>",
  "city": "<city name if user asked about weather, otherwise null>",
  "contact": "<contact name if whatsapp message, otherwise null>",
  "message": "<message text if user dictated one, otherwise null>"
}

URL Examples:
- "open youtube" → "url": "https://www.youtube.com"
- "search cats on youtube" → "url": "https://www.youtube.com/results?search_query=cats"
- "play shape of you on youtube" → "url": "https://www.youtube.com/results?search_query=shape+of+you"
- "open google" → "url": "https://www.google.com"
- "open instagram" → "url": "https://www.instagram.com"
- "open facebook" → "url": "https://www.facebook.com"
- "open calculator" → "url": "https://www.google.com/search?q=calculator"
- "open twitter" → "url": "https://www.twitter.com"
- "open netflix" → "url": "https://www.netflix.com"
- "open amazon" → "url": "https://www.amazon.in"
- "search iphone 16 on amazon" → "url": "https://www.amazon.in/s?k=iphone+16"
- "message John on WhatsApp" → "url": "https://web.whatsapp.com/", "contact": "John", "message": null
- "whatsapp Rohit saying happy birthday" → "url": "https://web.whatsapp.com/", "contact": "Rohit", "message": "happy birthday"
- "what is the capital of india" → "url": null
- "what time is it" → "url": null

Type meanings:
- "general": factual or informational question — answer it directly
- "google-search": user wants to search something on Google
- "youtube-search": user wants to search something on YouTube
- "youtube-play": user wants to play a video or song on YouTube
- "open-app": user wants to open any website or app
- "calculator-open": user wants to open calculator
- "instagram-open": user wants to open instagram
- "facebook-open": user wants to open facebook
- "weather-show": user wants to see weather on Google (open browser)
- "get-weather": user wants the assistant to SPEAK the weather aloud
- "get-news": user wants the assistant to READ the latest news headlines
- "whatsapp-message": user wants to send a WhatsApp message to someone
- "get-time": user asks for current time
- "get-date": user asks for today's date
- "get-day": user asks what day it is
- "get-month": user asks for the current month

Important:
- Use ${userName} if user asks who made you
- For "get-weather", always extract city into "city" field. Default city is "Indore".
- For "whatsapp-message", extract contact name into "contact" and message into "message" field.
- Only respond with the JSON object, nothing else.

now your userInput- ${command}`;
    const result = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
    });

    return result.choices[0].message.content;
  } catch (error) {
    console.log(error);
  }
};

export default groqResponse;
