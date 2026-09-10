const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: { url: "postgresql://postgres.gzubewmkmjtlzbcxsnkx:Matchapilates1@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres" }
  }
});
async function main() {
  const users = await prisma.user.findMany({ select: { id: true, name: true, imageUrl: true } });
  console.log(users);
}
main();
