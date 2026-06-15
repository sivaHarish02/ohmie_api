const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function main() {
    const sql = fs.readFileSync('init_scope.sql', 'utf8');
    const statements = sql.split(';').filter(s => s.trim().length > 0);
    for (let statement of statements) {
        await prisma.$executeRawUnsafe(statement);
    }
    console.log("SQL executed successfully.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
