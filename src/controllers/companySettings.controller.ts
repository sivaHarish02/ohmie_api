import { Request, Response } from 'express';
import * as settingsService from '../services/companySettings.service';

export const getPaymentSettings = async (_req: Request, res: Response) => {
    try {
        console.log("Fetching payment settings...");

        const settings = await settingsService.getPaymentSettings();
        console.log("Payment settings fetched:", settings);
        res.status(200).json({ settings });
    } catch (error: any) {
        res.status(error.status || 400).json({ error: error.message || 'Failed to fetch settings' });
    }
};

export const updatePaymentSettings = async (req: Request, res: Response) => {
    try {
        const settings = await settingsService.updatePaymentSettings(req.body);
        res.status(200).json({ message: 'Settings updated', settings });
    } catch (error: any) {
        res.status(error.status || 400).json({ error: error.message || 'Failed to update settings' });
    }
};
