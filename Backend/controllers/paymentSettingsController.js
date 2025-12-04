import PaymentSettings from "../models/PaymentSettings.js";

export const getSettings = async (req, res) => {
  let settings = await PaymentSettings.findOne();
  if (!settings) {
    settings = await PaymentSettings.create({});
  }
  res.json(settings);
};

export const updateSettings = async (req, res) => {
  
  const updates = {};
  if (req.body.upiId) updates.upiId = req.body.upiId;
  if (req.body.bankName) updates.bank = {
    name: req.body.bankName,
    accountNumber: req.body.accountNumber,
    ifsc: req.body.ifsc,
    holderName: req.body.holderName,
  };
  if (req.fileUrl) updates.qrCodeUrl = req.fileUrl; 
  updates.updatedAt = new Date();

  const settings = await PaymentSettings.findOneAndUpdate({}, { $set: updates }, { upsert: true, new: true });
  res.json(settings);
};
