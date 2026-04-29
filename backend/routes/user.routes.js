import express from "express"
import { askToAssistant, getCurrentUser, updateAssistant,saveContact,getContacts,deleteContact } from "../controllers/user.controllers.js"
import isAuth from "../middlewares/isAuth.js"
import upload from "../middlewares/multer.js"

const userRouter=express.Router()

userRouter.get("/current",isAuth,getCurrentUser)
userRouter.post("/update",isAuth,upload.single("assistantImage"),updateAssistant)
userRouter.post("/asktoassistant",isAuth,askToAssistant)

// 🔹 contacts (used by assistant)
userRouter.post("/contacts", isAuth, saveContact)
userRouter.get("/contacts", isAuth, getContacts)
userRouter.delete("/contacts/:name", isAuth, deleteContact)

export default userRouter