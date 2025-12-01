import { 
  initWhatsApp, 
  sendWhatsAppText, 
  sendWhatsAppImage, 
  getSock 
} from "./whatsappService.js";

let initialized = false;


export const initializeGlobalWhatsApp = async (io) => {
  if (!initialized) {
    await initWhatsApp(io);
    initialized = true;
    console.log("✅ Global WhatsApp initialized");
  }
  return getSock();
};


export const getGlobalSock = () => getSock();