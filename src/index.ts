import express from 'express';
import { createServer } from 'http';
import dotenv from 'dotenv';
import path from 'path';
import adminRoutes from './routes/admin.routes';
import categoryRoutes from './routes/category.routes';
import technicianRoutes from './routes/technician.routes';
import jobRoutes from './routes/job.routes';
import revenueRoutes from './routes/revenue.routes';
import spareRoutes from './routes/spare.routes';
import customSpareRoutes from './modules/customSpare/routes';
import paymentRoutes from './routes/payment.routes';
import walletRoutes from './routes/wallet.routes';
import fileRoutes from './routes/file.routes';
import { initSocketServer } from './socket/socket.server';


dotenv.config();

const app = express();
const httpServer = createServer(app);

// Initialize Socket.IO
initSocketServer(httpServer);

app.use(express.json());
//  all requests logger
app.use((req, _res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
});

// Static file serving for uploads
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.use('/admin', adminRoutes);
app.use('/admin/categories', categoryRoutes);
app.use('/admin/technicians', technicianRoutes);
app.use('/admin/job', jobRoutes);
app.use('/admin/revenue', revenueRoutes);
app.use('/admin/spares', spareRoutes);
app.use('/custom-spare', customSpareRoutes);
app.use('/admin/payment', paymentRoutes);
app.use('/wallet', walletRoutes);
app.use('/files', fileRoutes);
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";


const prisma = new PrismaClient();

// Test DB connection and log result
async function testDbConnection() {
    try {
        await prisma.$connect();
        console.log('Database connection successful');
    } catch (error) {
        console.error('Database connection failed:', error);
        process.exit(1);
    }
}

async function main() {
    const hashedPassword = await bcrypt.hash("123456", 10);

    await prisma.admin.create({
        data: {
            name: "Super Admin",
            email: "admin@example.com",
            mobile: "9876543210",
            password: hashedPassword,
            role: "SUPER_ADMIN",
        },
    });

    console.log("Admin created successfully");
}

// main()
//     .catch(console.error)
//     .finally(() => prisma.$disconnect());



const PORT = process.env.PORT || 4000;
testDbConnection().then(() => {
    httpServer.listen(PORT, () => {
        console.log(`Server running on port http://localhost:${PORT}`);
    });
});
