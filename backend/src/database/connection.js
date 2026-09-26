// Prisma — baza bilan ulanish (butun loyihada bitta nusxa)
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

module.exports = prisma;
