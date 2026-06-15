import { log } from 'console';
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

export interface CustomerAuthRequest extends Request {
    customer?: { id: number; role: string };
}

export const authenticateCustomerJWT = (req: CustomerAuthRequest, res: Response, next: NextFunction) => {
    // if (process.env.TESTING_MODE === 'true') {
    //     log('Testing mode ON - skipping customer authentication');
    //     req.customer = { id: 11, role: 'CUSTOMER' };
    //     return next();
    // }
    const authHeader = req.headers.authorization;
    console.log("Authenticating customer with header:", authHeader);
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'No token provided' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { id: number; role: string };
        if (decoded.role !== 'CUSTOMER') {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }
        log('JWT decoded successfully:', decoded);
        req.customer = decoded;
        next();
    } catch (err) {
        log('JWT Error:', err);
        return res.status(401).json({ success: false, message: 'Invalid token' });
    }
};
