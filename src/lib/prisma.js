"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
var client_1 = require("@prisma/client");
var adapter_pg_1 = require("@prisma/adapter-pg");
var pg_1 = require("pg");
var globalForPrisma = globalThis;
var connectionString = process.env.DATABASE_URL;
var pool = new pg_1.Pool({ connectionString: connectionString });
var adapter = new adapter_pg_1.PrismaPg(pool);
exports.prisma = globalForPrisma.prisma || new client_1.PrismaClient({ adapter: adapter });
if (process.env.NODE_ENV !== "production")
    globalForPrisma.prisma = exports.prisma;
