const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Fetching existing Job Categories...');
    const categories = await prisma.category.findMany();

    if (categories.length === 0) {
        console.log('No job categories found. Please seed categories first.');
        return;
    }

    console.log(`Found ${categories.length} categories. Starting seeding scopes of work...`);

    const scopesData = [
        { name: 'Diagnostic Assessment', status: 'APPROVED', createdBy: 'ADMIN' },
        { name: 'Routine Maintenance', status: 'APPROVED', createdBy: 'ADMIN' },
        { name: 'Part Replacement', status: 'APPROVED', createdBy: 'ADMIN' },
        { name: 'Full Overhaul', status: 'APPROVED', createdBy: 'ADMIN' },
        { name: 'Safety Inspection', status: 'APPROVED', createdBy: 'ADMIN' },
        { name: 'Firmware Update', status: 'PENDING', createdBy: 'TECHNICIAN' },
        { name: 'Wiring Repair', status: 'APPROVED', createdBy: 'ADMIN' }
    ];

    let createdCount = 0;

    for (const category of categories) {
        for (const scope of scopesData) {
            try {
                await prisma.scopeOfWork.upsert({
                    where: {
                        name_jobCategoryId: {
                            name: scope.name,
                            jobCategoryId: category.id
                        }
                    },
                    update: {},
                    create: {
                        name: scope.name,
                        jobCategoryId: category.id,
                        status: scope.status,
                        createdBy: scope.createdBy
                    }
                });
                createdCount++;
            } catch (error) {
                console.error(`Failed to seed scope '${scope.name}' for category '${category.name}':`, error.message);
            }
        }
    }

    console.log(`Successfully seeded/verified ${createdCount} scopes of work.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
