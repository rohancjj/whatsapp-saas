import express from 'express';
import fs from 'fs';
import path from 'path';
import { sendWhatsAppText, sendWhatsAppImage, IsWHConnected } from '../services/whatsappService.js';

const router = express.Router();


const qrFilePath = path.join(process.cwd(), 'qr_base64.txt');


router.get('/qr', (req, res) => {
  try {
    
    if (fs.existsSync(qrFilePath)) {
      const savedQR = fs.readFileSync(qrFilePath, 'utf8');
      if (savedQR) return res.json({ qr: savedQR });
    }

   
    res.status(404).json({ message: 'QR code not generated yet' });
  } catch (err) {
    console.error('Error reading QR code:', err);
    res.status(500).json({ error: err.message });
  }
});


router.get('/status', (req, res) => {
  const status = IsWHConnected() ? 'connected' : 'disconnected';
  res.json({ status });
});

export default router;