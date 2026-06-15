import { PrismaClient, TechnicianStatus, JobStatus } from '@prisma/client';
import { faker } from '@faker-js/faker/locale/en_IN';

const prisma = new PrismaClient();

const SERVICE_CHARGE_RANGE: [number, number] = [300, 1000];
const TECHNICIAN_EXPERIENCE_RANGE: [number, number] = [1, 10];
const TECHNICIAN_RATING_RANGE: [number, number] = [3.5, 5.0];
const SPARE_COST_RANGE: [number, number] = [100, 1000];
const SPARE_STOCK_RANGE: [number, number] = [5, 50];
const JOB_PHONE_PREFIX = '9';
const PAYMENT_METHODS = ['CASH', 'ONLINE'];
const CUSTOMER_COUNT = 10;

async function safeDelete(action: () => Promise<unknown>, label: string) {
    try {
        await action();
    } catch (error: any) {
        // Ignore missing table/model in partially migrated environments.
        if (error?.code === 'P2021') {
            console.warn(`Skipping cleanup for missing table: ${label}`);
            return;
        }
        throw error;
    }
}

function randomInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number, decimals = 1) {
    return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function randomDateWithin(days: number) {
    const now = new Date();
    const past = new Date(now.getTime() - randomInt(0, days) * 24 * 60 * 60 * 1000);
    return past;
}

function randomDateInLast30Days() {
    return randomDateWithin(30);
}

function randomChoice<T>(items: T[]): T {
    return items[randomInt(0, items.length - 1)];
}

const CATEGORY_DEFS = [
    { name: 'AC Installation', icon: 'ac_installation.png' },
    { name: 'AC Repair', icon: 'ac_repair.png' },
    { name: 'AC Gas Refill', icon: 'ac_gas_refill.png' },
    { name: 'Washing Machine Repair', icon: 'washing_machine.png' },
    { name: 'Refrigerator Repair', icon: 'refrigerator.png' },
    { name: 'RO Installation', icon: 'ro_installation.png' },
    { name: 'RO Service', icon: 'ro_service.png' },
    { name: 'Microwave Repair', icon: 'microwave.png' },
    { name: 'TV Repair', icon: 'tv.png' },
    { name: 'Geyser Service', icon: 'geyser.png' },
    { name: 'Chimney Service', icon: 'chimney.png' },
    { name: 'Fan Repair', icon: 'fan.png' },
    { name: 'Inverter Service', icon: 'inverter.png' },
    { name: 'CCTV Installation', icon: 'cctv.png' },
    { name: 'Plumbing', icon: 'plumbing.png' },
    { name: 'Electrical Works', icon: 'electrical.png' },
    { name: 'Laptop Repair', icon: 'laptop.png' },
    { name: 'Mobile Repair', icon: 'mobile.png' },
    { name: 'Water Heater Repair', icon: 'water_heater.png' },
    { name: 'General Maintenance', icon: 'general_maintenance.png' },
];

const SPARE_SKUS = Array.from({ length: 20 }, (_, i) => `SP-${String(i + 1).padStart(3, '0')}`);

const BRAND_NAMES = [
    'Samsung', 'LG', 'Voltas', 'Daikin', 'Blue Star',
    'Whirlpool', 'Godrej', 'Havells', 'Crompton', 'Kent',
];

// SpareCategory → mapped to which JobCategory (by name)
const SPARE_CATEGORY_DEFS: { name: string; jobCategoryName: string }[] = [
    { name: 'Compressor', jobCategoryName: 'AC Repair' },
    { name: 'Capacitor', jobCategoryName: 'AC Repair' },
    { name: 'Gas Kit', jobCategoryName: 'AC Gas Refill' },
    { name: 'Copper Pipe', jobCategoryName: 'AC Installation' },
    { name: 'Mounting Bracket', jobCategoryName: 'AC Installation' },
    { name: 'Drain Motor', jobCategoryName: 'Washing Machine Repair' },
    { name: 'Water Inlet Valve', jobCategoryName: 'Washing Machine Repair' },
    { name: 'Belt', jobCategoryName: 'Washing Machine Repair' },
    { name: 'Thermostat', jobCategoryName: 'Refrigerator Repair' },
    { name: 'Door Gasket', jobCategoryName: 'Refrigerator Repair' },
    { name: 'Fan Motor', jobCategoryName: 'Refrigerator Repair' },
    { name: 'RO Membrane', jobCategoryName: 'RO Service' },
    { name: 'Sediment Filter', jobCategoryName: 'RO Service' },
    { name: 'UV Lamp', jobCategoryName: 'RO Service' },
    { name: 'Carbon Filter', jobCategoryName: 'RO Installation' },
    { name: 'Magnetron', jobCategoryName: 'Microwave Repair' },
    { name: 'Heating Element', jobCategoryName: 'Geyser Service' },
    { name: 'Circuit Board', jobCategoryName: 'TV Repair' },
    { name: 'Motor Winding', jobCategoryName: 'Fan Repair' },
    { name: 'General Hardware', jobCategoryName: 'General Maintenance' },
];

async function main() {
    // Upsert categories first (safe to re-run)
    const upsertOps = CATEGORY_DEFS.map(def =>
        prisma.category.upsert({
            where: { name: def.name },
            update: { icon: def.icon, isActive: true, updatedAt: new Date() },
            create: { name: def.name, icon: def.icon, isActive: true, createdAt: randomDateInLast30Days() },
        })
    );

    await prisma.$transaction(upsertOps);

    const categories = await prisma.category.findMany();
    const categoryIds = categories.map(c => c.id);
    const catByName = Object.fromEntries(categories.map(c => [c.name.toLowerCase(), c.id])) as Record<string, number>;
    const randomCategoryId = () => categoryIds[Math.floor(Math.random() * categoryIds.length)];

    // Remove old dependent data (keep categories)
    await safeDelete(() => prisma.jobScope.deleteMany(), 'JobScope');
    await safeDelete(() => prisma.spareUsage.deleteMany(), 'SpareUsage');
    await safeDelete(() => prisma.payment.deleteMany(), 'Payment');
    await safeDelete(() => prisma.job.deleteMany(), 'Job');
    await safeDelete(() => prisma.walletTransaction.deleteMany(), 'WalletTransaction');
    await safeDelete(() => prisma.payout.deleteMany(), 'Payout');
    await safeDelete(() => prisma.wallet.deleteMany(), 'Wallet');
    await safeDelete(() => prisma.customSpareRequest.deleteMany(), 'CustomSpareRequest');
    await safeDelete(() => prisma.spare.deleteMany(), 'Spare');
    await safeDelete(() => prisma.spareCategory.deleteMany(), 'SpareCategory');
    await safeDelete(() => prisma.brand.deleteMany(), 'Brand');
    await safeDelete(() => prisma.technician.deleteMany(), 'Technician');
    await safeDelete(() => prisma.customer.deleteMany(), 'Customer');

    // 1) Technicians
    const technicians = [];
    for (let i = 0; i < 20; i++) {
        const isActive = i < 15;
        const name = faker.person.fullName();
        const phone = JOB_PHONE_PREFIX + faker.string.numeric(9);
        const email = faker.internet.email({ firstName: name.split(' ')[0], lastName: name.split(' ')[1] || '', provider: 'gmail.com' }).toLowerCase();
        const experience = randomInt(...TECHNICIAN_EXPERIENCE_RANGE);
        const rating = randomFloat(...TECHNICIAN_RATING_RANGE, 1);
        const createdAt = randomDateWithin(60);
        technicians.push({
            name,
            mobile: phone,
            email,
            password: faker.internet.password({ length: 10 }),
            isActive,
            status: isActive ? TechnicianStatus.ACTIVE : TechnicianStatus.BLOCKED,
            createdAt,
            updatedAt: createdAt,
            experience,
            rating,
        });
    }

    await prisma.technician.createMany({ data: technicians });
    const allTechnicians = await prisma.technician.findMany();

    // 1.5) Customers
    const customerSeedData = Array.from({ length: CUSTOMER_COUNT }).map((_, i) => {
        const firstName = faker.person.firstName();
        const lastName = faker.person.lastName();
        const mobile = `9${String(880000000 + i)}`;
        const createdAt = randomDateWithin(45);

        return {
            name: `${firstName} ${lastName}`,
            mobile,
            otpCode: null,
            otpExpiry: null,
            isActive: true,
            createdAt,
            updatedAt: createdAt,
        };
    });

    await prisma.customer.createMany({ data: customerSeedData });
    const allCustomers = await prisma.customer.findMany({ orderBy: { id: 'asc' } });

    // 2) Brands
    await prisma.brand.createMany({
        data: BRAND_NAMES.map(name => ({
            name,
            isActive: true,
            createdAt: randomDateWithin(60),
            updatedAt: new Date(),
        })),
    });
    const allBrands = await prisma.brand.findMany();
    const randomBrandId = () => allBrands[Math.floor(Math.random() * allBrands.length)].id;

    // 3) Spare Categories (linked to job categories)
    for (const def of SPARE_CATEGORY_DEFS) {
        const jobCatId = catByName[def.jobCategoryName.toLowerCase()];
        if (!jobCatId) continue;
        await prisma.spareCategory.upsert({
            where: { name_jobCategoryId: { name: def.name, jobCategoryId: jobCatId } },
            update: { isActive: true },
            create: {
                name: def.name,
                jobCategoryId: jobCatId,
                isActive: true,
                createdAt: randomDateWithin(30),
                updatedAt: new Date(),
            },
        });
    }
    const allSpareCategories = await prisma.spareCategory.findMany();
    const randomSpareCategoryId = () => allSpareCategories[Math.floor(Math.random() * allSpareCategories.length)].id;

    // 4) Spares (with spareCategoryId and brandId)
    const spares = [] as any[];
    for (let i = 0; i < 20; i++) {
        const costPrice = randomInt(...SPARE_COST_RANGE);
        const sellingPrice = Math.round(costPrice * 1.3);
        const stockQty = randomInt(...SPARE_STOCK_RANGE);
        const minStock = [5, 10][randomInt(0, 1)];
        const createdAt = randomDateWithin(30);

        // Pick a random spare category and use its jobCategoryId as the category
        const spareCat = allSpareCategories[randomInt(0, allSpareCategories.length - 1)];

        spares.push({
            name: faker.commerce.productName(),
            sku: SPARE_SKUS[i],
            categoryId: spareCat.jobCategoryId,
            spareCategoryId: spareCat.id,
            brandId: randomBrandId(),
            costPrice,
            sellingPrice,
            stockQty,
            minStock,
            isActive: true,
            createdAt,
            updatedAt: createdAt,
        });
    }
    await prisma.spare.createMany({ data: spares });
    const allSpares = await prisma.spare.findMany();

    // 5) Jobs linked to customers
    const jobs = [] as any[];
    const jobStatusPool: JobStatus[] = [
        JobStatus.CREATED,
        JobStatus.ASSIGNED,
        JobStatus.ACCEPTED,
        JobStatus.IN_PROGRESS,
        JobStatus.WAITING_OTP,
        JobStatus.COMPLETED,
        JobStatus.REJECTED,
    ];

    const TOTAL_JOBS = 30;

    const customerSequence = [
        ...allCustomers,
        ...Array.from({ length: Math.max(0, TOTAL_JOBS - allCustomers.length) }, () => randomChoice(allCustomers)),
    ];

    for (let i = 0; i < customerSequence.length; i++) {
        const customer = customerSequence[i];
        const customerName = customer.name || faker.person.fullName();
        const phone = customer.mobile;
        const address = `${faker.location.streetAddress()}, ${faker.location.city()}, ${faker.location.state()}`;
        const scheduleAt = new Date(Date.now() + (randomInt(-10, 5) * 24 * 60 * 60 * 1000));
        const status = randomChoice(jobStatusPool);
        const serviceCharge = randomInt(...SERVICE_CHARGE_RANGE);
        const technician = allTechnicians[randomInt(0, allTechnicians.length - 1)];
        const createdAt = randomDateWithin(15);
        const categoryId = randomCategoryId();
        const requiresTechnician =
            status !== JobStatus.CREATED && status !== JobStatus.REJECTED;

        jobs.push({
            jobCode: `JOB-${String(i + 1).padStart(4, '0')}`,
            customerName,
            customerPhone: phone,
            address,
            latitude: Number(faker.location.latitude({ min: 12.7, max: 13.2, precision: 8 })),
            longitude: Number(faker.location.longitude({ min: 77.4, max: 77.8, precision: 8 })),
            description: faker.lorem.sentence(),
            categoryId,
            technicianId: requiresTechnician ? technician.id : null,
            customerId: customer.id,
            status,
            scheduleTime: scheduleAt,
            totalAmount: serviceCharge,
            technicianShare: Math.round(serviceCharge * 0.7),
            companyShare: Math.round(serviceCharge * 0.3),
            isDeleted: false,
            createdAt,
            updatedAt: createdAt,
        });
    }
    await prisma.job.createMany({ data: jobs });
    const allJobs = await prisma.job.findMany();

    // 6) Spare Usage (for completed jobs)
    const completedJobs = allJobs.filter(j => j.status === JobStatus.COMPLETED);
    const spareUsages = [] as any[];
    for (const job of completedJobs) {
        const numSpares = randomInt(1, 3);
        const usedSpares = faker.helpers.arrayElements(allSpares, numSpares);
        for (const spare of usedSpares) {
            const quantity = randomInt(1, 3);
            if (spare.stockQty < quantity) continue;
            const totalPrice = spare.sellingPrice * quantity;
            spareUsages.push({
                jobId: job.id,
                spareId: spare.id,
                quantity,
                totalPrice,
                createdAt: new Date(),
            });
            // Deduct stock
            await prisma.spare.update({ where: { id: spare.id }, data: { stockQty: { decrement: quantity } } });
            // Update job amount
            await prisma.job.update({ where: { id: job.id }, data: { totalAmount: { increment: totalPrice } } });
        }
    }
    if (spareUsages.length) await prisma.spareUsage.createMany({ data: spareUsages });

    // 7) Payments (for completed jobs)
    for (const job of completedJobs) {
        await prisma.payment.create({
            data: {
                jobId: job.id,
                amount: job.totalAmount,
                paidAt: new Date(),
                method: PAYMENT_METHODS[randomInt(0, PAYMENT_METHODS.length - 1)],
                status: 'PAID',
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        });
    }

    // 8) Company Payment Settings (sample)
    await prisma.companyPaymentSettings.upsert({
        where: { id: 1 },
        update: {},
        create: {
            upiId: 'ohmietech@upi',
            mobileNumber: '9876543210',
            qrImage: null,
        },
    });

    const customerJobsCount = await prisma.job.groupBy({
        by: ['customerId'],
        _count: { _all: true },
        where: { customerId: { not: null } },
    });

    console.log(
        `Seed complete. Categories: ${categories.length}, Brands: ${allBrands.length}, SpareCategories: ${allSpareCategories.length}, Spares: ${allSpares.length}, Customers: ${allCustomers.length}, Jobs: ${allJobs.length}, CompletedJobs: ${completedJobs.length}, CustomerJobBuckets: ${customerJobsCount.length}.`
    );
}

main()
    .then(async () => {
        await prisma.$disconnect();
        console.log('Seed finished successfully');
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        // process.exit(1);
    });