import React, { useContext, useEffect, useState } from "react";
import { userDataContext } from "../context/UserContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { RxCross1 } from "react-icons/rx";
import { CgMenuRight } from "react-icons/cg";

function Contacts() {
  const { userData, serverUrl, setUserData } = useContext(userDataContext);
  const navigate = useNavigate();

  const [contacts, setContacts] = useState([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // "success" | "error"
  const [loading, setLoading] = useState(false);
  const [ham, setHam] = useState(false);

  const fetchContacts = async () => {
    try {
      const res = await axios.get(`${serverUrl}/api/user/contacts`, {
        withCredentials: true,
      });
      setContacts(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const sanitizePhone = (p) => {
    let cleaned = p.replace(/[\s\-\(\)\+]/g, "");
    if (cleaned.startsWith("0")) cleaned = "91" + cleaned.slice(1);
    if (cleaned.length === 10) cleaned = "91" + cleaned;
    return cleaned;
  };

  const handleSave = async () => {
    if (!name.trim() || !phone.trim()) {
      setMessage("Name and phone are required.");
      setMessageType("error");
      return;
    }
    const cleaned = sanitizePhone(phone.trim());
    if (cleaned.length < 10) {
      setMessage("Enter a valid phone number.");
      setMessageType("error");
      return;
    }
    setLoading(true);
    try {
      await axios.post(
        `${serverUrl}/api/user/contacts`,
        { name: name.trim(), phone: cleaned },
        { withCredentials: true }
      );
      setMessage(`"${name.trim()}" saved successfully!`);
      setMessageType("success");
      setName("");
      setPhone("");
      fetchContacts();
    } catch (err) {
      setMessage("Failed to save contact.");
      setMessageType("error");
    }
    setLoading(false);
    setTimeout(() => setMessage(""), 3000);
  };

  const handleDelete = async (contactName) => {
    try {
      await axios.delete(
        `${serverUrl}/api/user/contacts/${encodeURIComponent(contactName)}`,
        { withCredentials: true }
      );
      setContacts((prev) => prev.filter((c) => c.name !== contactName));
    } catch (err) {
      console.log(err);
    }
  };

  const handleLogOut = async () => {
    try {
      await axios.get(`${serverUrl}/api/auth/logout`, { withCredentials: true });
      setUserData(null);
      navigate("/signin");
    } catch (error) {
      setUserData(null);
    }
  };

  return (
    <div className="w-full min-h-[100vh] bg-gradient-to-t from-[black] to-[#02023d] flex flex-col items-center px-4 py-10 gap-8 relative overflow-x-hidden">

      {/* Mobile hamburger */}
      <CgMenuRight
        className="lg:hidden text-white absolute top-[20px] right-[20px] w-[25px] h-[25px] cursor-pointer"
        onClick={() => setHam(true)}
      />

      {/* Mobile menu */}
      <div
        className={`absolute lg:hidden top-0 w-full h-full bg-[#00000053] backdrop-blur-lg p-[20px] flex flex-col gap-[20px] items-start z-50 ${ham ? "translate-x-0" : "translate-x-full"} transition-transform`}
      >
        <RxCross1
          className="text-white absolute top-[20px] right-[20px] w-[25px] h-[25px] cursor-pointer"
          onClick={() => setHam(false)}
        />
        <button
          className="min-w-[150px] h-[60px] text-black font-semibold bg-white rounded-full cursor-pointer text-[19px]"
          onClick={handleLogOut}
        >
          Log Out
        </button>
        <button
          className="min-w-[150px] h-[60px] text-black font-semibold bg-white rounded-full cursor-pointer text-[19px] px-[20px]"
          onClick={() => navigate("/")}
        >
          Home
        </button>
      </div>

      {/* Desktop buttons */}
      <button
        className="min-w-[150px] h-[60px] text-black font-semibold absolute hidden lg:block top-[20px] right-[20px] bg-white rounded-full cursor-pointer text-[19px]"
        onClick={handleLogOut}
      >
        Log Out
      </button>
      <button
        className="min-w-[150px] h-[60px] text-black font-semibold absolute hidden lg:block top-[100px] right-[20px] bg-white rounded-full cursor-pointer text-[19px] px-[20px]"
        onClick={() => navigate("/")}
      >
        ← Home
      </button>

      {/* Title */}
      <h1 className="text-white text-[28px] font-bold mt-4 tracking-wide">
        Contacts Manager
      </h1>
      <p className="text-gray-400 text-[14px] -mt-6 text-center">
        Save contacts here so your assistant can message them on WhatsApp
      </p>

      {/* Add Contact Form */}
      <div className="w-full max-w-[480px] bg-white/10 backdrop-blur-md rounded-2xl p-6 flex flex-col gap-4 border border-white/10">
        <h2 className="text-white text-[18px] font-semibold">Add / Update Contact</h2>

        <input
          type="text"
          placeholder='Name  (e.g. "mummy", "Rohit")'
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full h-[50px] rounded-xl bg-white/10 text-white placeholder-gray-400 px-4 outline-none border border-white/10 focus:border-white/40 transition-all text-[15px]"
        />

        <input
          type="tel"
          placeholder="Phone number (10 digits or with +91)"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full h-[50px] rounded-xl bg-white/10 text-white placeholder-gray-400 px-4 outline-none border border-white/10 focus:border-white/40 transition-all text-[15px]"
        />

        {message && (
          <p className={`text-[13px] font-medium ${messageType === "success" ? "text-green-400" : "text-red-400"}`}>
            {message}
          </p>
        )}

        <button
          onClick={handleSave}
          disabled={loading}
          className="w-full h-[50px] bg-white text-black font-semibold rounded-xl cursor-pointer text-[16px] hover:bg-gray-200 transition-all disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save Contact"}
        </button>
      </div>

      {/* Contacts List */}
      <div className="w-full max-w-[480px] flex flex-col gap-3">
        <h2 className="text-white text-[18px] font-semibold">
          Saved Contacts ({contacts.length})
        </h2>

        {contacts.length === 0 && (
          <p className="text-gray-400 text-[14px]">
            No contacts saved yet. Add one above.
          </p>
        )}

        {contacts.map((c, i) => (
          <div
            key={i}
            className="w-full flex items-center justify-between bg-white/10 backdrop-blur-md rounded-xl px-4 py-3 border border-white/10"
          >
            <div className="flex flex-col">
              <span className="text-white font-semibold text-[15px] capitalize">{c.name}</span>
              <span className="text-gray-400 text-[13px]">+{c.phone}</span>
            </div>
            <button
              onClick={() => handleDelete(c.name)}
              className="text-red-400 hover:text-red-300 font-semibold text-[13px] cursor-pointer transition-all"
            >
              Delete
            </button>
          </div>
        ))}
      </div>

      {/* Usage tip */}
      <div className="w-full max-w-[480px] bg-white/5 rounded-2xl p-4 border border-white/10">
        <h3 className="text-white font-semibold text-[14px] mb-2">💡 How to use</h3>
        <ul className="text-gray-400 text-[13px] flex flex-col gap-1">
          <li>• Save contact with the exact name you'll say to the assistant</li>
          <li>• Say: <span className="text-white">"[Assistant] message Rohit on WhatsApp saying happy birthday"</span></li>
          <li>• Say: <span className="text-white">"[Assistant] send Hi on WhatsApp to mummy"</span></li>
          <li>• Phone: enter 10-digit number — country code added automatically</li>
        </ul>
      </div>
    </div>
  );
}

export default Contacts;