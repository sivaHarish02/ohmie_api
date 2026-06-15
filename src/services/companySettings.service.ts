import prisma from '../utils/prisma';

export const getPaymentSettings = async () => {
    let settings = await prisma.companyPaymentSettings.findFirst();
    if (!settings) {
        settings = await prisma.companyPaymentSettings.create({ data: {} });
    }
    return settings;
};

export const updatePaymentSettings = async (data: {
    upiId?: string;
    mobileNumber?: string;
    qrImage?: string;
}) => {
    let settings = await prisma.companyPaymentSettings.findFirst();
    if (!settings) {
        return prisma.companyPaymentSettings.create({ data });
    }
    return prisma.companyPaymentSettings.update({
        where: { id: settings.id },
        data,
    });
};
