import uploadOnCloudinary from "../config/cloudinary.js";
import groqResponse from "../gemini.js";
import User from "../models/user.model.js";
import moment from "moment";
import axios from "axios";

// ✅ Weather helper
const getWeather = async (city) => {
  try {
    const apiKey = process.env.WEATHER_API_KEY;
    console.log("🔑 API Key:", apiKey);
    console.log("🏙️ City:", city);

    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;
    console.log("🌐 URL:", url);

    const res = await axios.get(url);
    const data = res.data;
    const temp = data.main.temp;
    const description = data.weather[0].description;
    const humidity = data.main.humidity;
    return `The weather in ${city} is ${description} with a temperature of ${temp} degrees Celsius and humidity of ${humidity} percent.`;
  } catch (error) {
    console.log("❌ Weather Error:", error.response?.data || error.message);
    return `Sorry, I couldn't fetch the weather for ${city}.`;
  }
};

// ✅ News helper
const getNews = async () => {
  try {
    const apiKey = process.env.NEWS_API_KEY;
    const url = `https://newsapi.org/v2/top-headlines?country=in&pageSize=3&apiKey=${apiKey}`;
    const res = await axios.get(url);
    const articles = res.data.articles;
    if (!articles || articles.length === 0)
      return "Sorry, no news available right now.";
    const headlines = articles.map((a, i) => `${i + 1}. ${a.title}`).join(". ");
    return `Here are today's top headlines. ${headlines}`;
  } catch (error) {
    return "Sorry, I couldn't fetch the news right now.";
  }
};

// ─────────────────────────────────────────────
// GET CURRENT USER
// ─────────────────────────────────────────────
export const getCurrentUser = async (req, res) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(400).json({ message: "user not found" });
    }
    return res.status(200).json(user);
  } catch (error) {
    return res.status(400).json({ message: "get current user error" });
  }
};

// ─────────────────────────────────────────────
// UPDATE ASSISTANT
// ─────────────────────────────────────────────
export const updateAssistant = async (req, res) => {
  try {
    const { assistantName, imageUrl } = req.body;
    let assistantImage;
    if (req.file) {
      assistantImage = await uploadOnCloudinary(req.file.path);
    } else {
      assistantImage = imageUrl;
    }
    const user = await User.findByIdAndUpdate(
      req.userId,
      { assistantName, assistantImage },
      { new: true },
    ).select("-password");
    return res.status(200).json(user);
  } catch (error) {
    return res.status(400).json({ message: "updateAssistantError user error" });
  }
};

// ─────────────────────────────────────────────
// SAVE CONTACT
// ─────────────────────────────────────────────
export const saveContact = async (req, res) => {
  try {
    const { name, phone } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ message: "Name and phone are required" });
    }
    const user = await User.findById(req.userId);

    // update if contact already exists, else push new
    const existingIndex = user.contacts.findIndex(
      (c) => c.name.toLowerCase() === name.toLowerCase(),
    );
    if (existingIndex !== -1) {
      user.contacts[existingIndex].phone = phone;
    } else {
      user.contacts.push({ name, phone });
    }

    await user.save();
    return res
      .status(200)
      .json({ message: "Contact saved", contacts: user.contacts });
  } catch (error) {
    return res.status(500).json({ message: "Save contact error" });
  }
};

// ─────────────────────────────────────────────
// GET CONTACTS
// ─────────────────────────────────────────────
export const getContacts = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("contacts");
    return res.status(200).json(user.contacts);
  } catch (error) {
    return res.status(500).json({ message: "Get contacts error" });
  }
};

// ─────────────────────────────────────────────
// DELETE CONTACT
// ─────────────────────────────────────────────
export const deleteContact = async (req, res) => {
  try {
    const { name } = req.params;
    const user = await User.findById(req.userId);
    user.contacts = user.contacts.filter(
      (c) => c.name.toLowerCase() !== name.toLowerCase(),
    );
    await user.save();
    return res
      .status(200)
      .json({ message: "Contact deleted", contacts: user.contacts });
  } catch (error) {
    return res.status(500).json({ message: "Delete contact error" });
  }
};

// 🔹 alias mapping
const nameAliases = {
  mummy: ["mom", "mother", "maa"],
  papa: ["dad", "father"],
};

// 🔹 resolve name
const resolveName = (name) => {
  name = name.toLowerCase();

  for (let key in nameAliases) {
    if (key === name || nameAliases[key].includes(name)) {
      return key;
    }
  }
  return name;
};

// 🔹 smart matching
const findContact = (contacts, inputName) => {
  inputName = inputName.toLowerCase().trim();

  // exact match first
  let match = contacts.find((c) => c.name.toLowerCase() === inputName);
  if (match) return match;

  // saved name contains input (e.g. saved: "Rohit Sharma", input: "Rohit")
  match = contacts.find((c) => c.name.toLowerCase().includes(inputName));
  if (match) return match;

  // input contains saved name (e.g. saved: "Rohit", input: "Rohit Sharma")
  match = contacts.find((c) => inputName.includes(c.name.toLowerCase()));
  if (match) return match;

  return null;
};

// 🔹 sanitize phone number for wa.me
const sanitizePhone = (phone) => {
  let cleaned = phone.replace(/[\s\-\(\)\+]/g, "");
  if (cleaned.startsWith("0")) cleaned = "91" + cleaned.slice(1);
  if (cleaned.length === 10) cleaned = "91" + cleaned;
  return cleaned;
};
// ─────────────────────────────────────────────
// ASK ASSISTANT  ← all your cases are here
// ─────────────────────────────────────────────
export const askToAssistant = async (req, res) => {
  try {
    const { command } = req.body;
    const user = await User.findById(req.userId);
    user.history.push(command);
    user.save();

    const userName = user.name;
    const assistantName = user.assistantName;

    const result = await groqResponse(command, assistantName, userName);

    const jsonMatch = result.match(/{[\s\S]*}/);
    if (!jsonMatch) {
      return res.status(400).json({ response: "sorry, i can't understand" });
    }

    const groqResult = JSON.parse(jsonMatch[0]);
    console.log(groqResult);
    const type = groqResult.type;

    switch (type) {
      // ── Date / Time ──────────────────────────
      case "get-date":
        return res.json({
          type,
          userInput: groqResult.userInput,
          response: `current date is ${moment().format("YYYY-MM-DD")}`,
        });

      case "get-time":
        return res.json({
          type,
          userInput: groqResult.userInput,
          response: `current time is ${moment().format("hh:mm A")}`,
        });

      case "get-day":
        return res.json({
          type,
          userInput: groqResult.userInput,
          response: `today is ${moment().format("dddd")}`,
        });

      case "get-month":
        return res.json({
          type,
          userInput: groqResult.userInput,
          response: `today is ${moment().format("MMMM")}`,
        });

      // ── Weather (spoken) ─────────────────────
      case "get-weather": {
        const city = groqResult.city || "Indore";
        const weatherResponse = await getWeather(city);
        return res.json({
          type,
          userInput: groqResult.userInput,
          response: weatherResponse,
          url: null,
        });
      }

      // ── News (spoken) ────────────────────────
      case "get-news": {
        const newsResponse = await getNews();
        return res.json({
          type,
          userInput: groqResult.userInput,
          response: newsResponse,
          url: null,
        });
      }

      // ── WhatsApp ─────────────────────────────  ✅ NEW
      case "whatsapp-message": {
        let rawContact = (groqResult.contact || "").toLowerCase().trim();
        rawContact = rawContact
          .replace(/\s+on\s+whatsapp/gi, "")
          .replace(/\s+via\s+whatsapp/gi, "")
          .trim();

        console.log("Raw contact from Groq:", groqResult.contact);
        console.log("After cleanup:", rawContact);

        const message = groqResult.message || "";
        const encodedMessage = encodeURIComponent(message);
        const resolvedName = resolveName(rawContact);
        const savedContact = findContact(user.contacts || [], resolvedName);

        console.log("Resolved name:", resolvedName);
        console.log("Found contact:", savedContact);

        let whatsappUrl;

        if (savedContact?.phone) {
          const phone = sanitizePhone(savedContact.phone);
          whatsappUrl = `https://wa.me/${phone}${
            message ? `?text=${encodedMessage}` : ""
          }`;
        } else {
          whatsappUrl = `https://web.whatsapp.com/`;
        }

        return res.json({
          type,
          userInput: groqResult.userInput,
          response: savedContact
            ? `Opening WhatsApp chat with ${savedContact.name}.`
            : rawContact
              ? `I couldn't find ${rawContact} in your contacts. Please save it first.`
              : `Opening WhatsApp.`,
          url: whatsappUrl,
        });
      }

      // ── Everything else (url-based) ──────────
      case "google-search":
      case "youtube-search":
      case "youtube-play":
      case "general":
      case "calculator-open":
      case "instagram-open":
      case "facebook-open":
      case "weather-show":
      case "open-app":
        return res.json({
          type,
          userInput: groqResult.userInput,
          response: groqResult.response,
          url: groqResult.url,
        });

      default:
        return res
          .status(400)
          .json({ response: "I didn't understand that command." });
    }
  } catch (error) {
    console.log("❌ Full error:", error); // change this line
    return res.status(500).json({ response: "ask assistant error" });
  }
};
