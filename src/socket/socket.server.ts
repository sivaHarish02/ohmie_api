import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { handleSocketEvents } from './socket.handler';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

// In-memory connection store
const technicianSockets = new Map<number, string>(); // technicianId → socketId
const adminSockets = new Map<number, string>();       // adminId → socketId
const customerSockets = new Map<number, string>();    // customerId → socketId

let io: Server;

export const initSocketServer = (httpServer: HttpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST'],
        },
    });

    // Auth middleware — verify JWT on handshake
    io.use((socket: Socket, next) => {
        const token = socket.handshake.auth?.token;
        if (!token) {
            return next(new Error('Authentication token required'));
        }
        try {
            const decoded = jwt.verify(token, JWT_SECRET) as { id: number; role: string };
            (socket as any).userId = decoded.id;
            (socket as any).userRole = decoded.role;
            next();
        } catch (err) {
            return next(new Error('Invalid token'));
        }
    });

    io.on('connection', (socket: Socket) => {
        const userId = (socket as any).userId as number;
        const role = (socket as any).userRole as string;

        // Register in the appropriate connection map
        if (role === 'TECHNICIAN') {
            technicianSockets.set(userId, socket.id);
            socket.join(`technician_${userId}`);
            console.log(`[Socket] Technician ${userId} connected (${socket.id})`);
        } else if (role === 'CUSTOMER') {
            customerSockets.set(userId, socket.id);
            socket.join(`customer_${userId}`);
            console.log(`[Socket] Customer ${userId} connected (${socket.id})`);
        } else {
            adminSockets.set(userId, socket.id);
            socket.join('admins');
            console.log(`[Socket] Admin ${userId} connected (${socket.id})`);
        }

        // Register event handlers
        handleSocketEvents(io, socket, userId, role);

        // Disconnect
        socket.on('disconnect', () => {
            if (role === 'TECHNICIAN') {
                technicianSockets.delete(userId);
                console.log(`[Socket] Technician ${userId} disconnected`);
            } else if (role === 'CUSTOMER') {
                customerSockets.delete(userId);
                console.log(`[Socket] Customer ${userId} disconnected`);
            } else {
                adminSockets.delete(userId);
                console.log(`[Socket] Admin ${userId} disconnected`);
            }
        });
    });

    console.log('[Socket] Socket.IO server initialized');
    return io;
};

export const getIO = (): Server => {
    if (!io) throw new Error('Socket.IO not initialized');
    return io;
};

// --- Emit helpers ---

export const emitToTechnician = (technicianId: number, event: string, data: any) => {
    if (!io) return;
    io.to(`technician_${technicianId}`).emit(event, data);
};

export const emitToAllAdmins = (event: string, data: any) => {
    if (!io) return;
    io.to('admins').emit(event, data);
};

export const emitToAll = (event: string, data: any) => {
    if (!io) return;
    io.emit(event, data);
};

export const emitToCustomer = (customerId: number, event: string, data: any) => {
    if (!io) return;
    io.to(`customer_${customerId}`).emit(event, data);
};

export { technicianSockets, adminSockets, customerSockets };
