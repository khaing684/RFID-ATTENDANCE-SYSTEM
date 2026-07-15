const prisma = require('../config/db');
const { hashPassword } = require('../utils/password');

/**
 * Seed Data - Development အတွက် နမူနာ data များ
 * Run: npm run db:seed
 */
const seed = async () => {
  console.log('🌱 Seeding database...\n');

  // ============================================
  // 1. USERS
  // ============================================
  const adminPassword = await hashPassword('admin123');
  const teacherPassword = await hashPassword('teacher123');
  const studentPassword = await hashPassword('student123');

  const admin = await prisma.user.upsert({
    where: { email: 'admin@gmail.com' },
    update: {},
    create: {
      name: 'Admin',
      email: 'admin@gmail.com',
      password: adminPassword,
      role: 'ADMIN',
      phone: '09123456789',
    },
  });

  const teacher = await prisma.user.upsert({
    where: { email: 'teacher@gmail.com' },
    update: {},
    create: {
      name: 'Daw Mya Mya',
      email: 'teacher@gmail.com',
      password: teacherPassword,
      role: 'TEACHER',
      phone: '09111111111',
    },
  });

  const students = [];
  const studentNames = [
    'Mg Mg', 'Aye Aye', 'Ko Ko', 'Su Su',
    'Hla Hla', 'Zaw Zaw', 'Moe Moe', 'Tun Tun',
    'Nu Nu', 'Kyaw Kyaw',
  ];

  for (let i = 0; i < studentNames.length; i++) {
    const student = await prisma.user.upsert({
      where: { email: `student${i + 1}@gmail.com` },
      update: {},
      create: {
        name: studentNames[i],
        email: `student${i + 1}@gmail.com`,
        password: studentPassword,
        role: 'STUDENT',
      },
    });
    students.push(student);
  }

  console.log(`✅ Users: 1 admin + 1 teacher + ${students.length} students`);

  // ============================================
  // 2. DEVICES
  // ============================================
  const mainGate = await prisma.device.upsert({
    where: { deviceCode: 'DEV-MAIN-001' },
    update: {},
    create: {
      name: 'Main Gate Reader',
      deviceCode: 'DEV-MAIN-001',
      deviceType: 'FIXED',
      location: 'ကျောင်းဝင်ပေါက်',
      status: 'ONLINE',
      lastSeenAt: new Date(),
      createdById: admin.id,
    },
  });

  console.log('✅ Devices: 1 device (Main Gate)\n');

  // ============================================
  // 3. TAGS
  // ============================================
  // Teacher tag
  await prisma.tag.upsert({
    where: { rfidCode: 'RF-TCH-0001' },
    update: {},
    create: {
      rfidCode: 'RF-TCH-0001',
      tagType: 'PASSIVE',
      description: 'Daw Mya Mya ကတ်',
      assignedToId: teacher.id,
      assignedAt: new Date(),
      createdById: admin.id,
    },
  });

  // Student tags
  for (let i = 0; i < students.length; i++) {
    const code = `RF-STU-${String(i + 1).padStart(4, '0')}`;
    await prisma.tag.upsert({
      where: { rfidCode: code },
      update: {},
      create: {
        rfidCode: code,
        tagType: 'PASSIVE',
        description: `${studentNames[i]} ကတ်`,
        assignedToId: students[i].id,
        assignedAt: new Date(),
        createdById: admin.id,
      },
    });
  }

  // Extra unassigned tags
  for (let i = 1; i <= 3; i++) {
    const code = `RF-EXTRA-${String(i).padStart(4, '0')}`;
    await prisma.tag.upsert({
      where: { rfidCode: code },
      update: {},
      create: {
        rfidCode: code,
        tagType: 'PASSIVE',
        description: 'အပိုကတ်',
        status: i === 3 ? 'LOST' : 'ACTIVE',
        createdById: admin.id,
      },
    });
  }

  console.log('✅ Tags: 1 teacher + 10 student + 3 extra tags\n');

  // ============================================
  // 4. SCAN LOGS
  // ============================================
  const scanData = [];

  // ဒီနေ့ မနက်ပိုင်း scan တွေ
  const today = new Date();
  for (let i = 0; i < 5; i++) {
    const hour = 7 + i; // 7AM to 11AM
    const minutes = Math.floor(Math.random() * 60);
    scanData.push({
      tagId: (await prisma.tag.findUnique({ where: { rfidCode: `RF-STU-${String(i + 1).padStart(4, '0')}` } })).id,
      deviceId: mainGate.id,
      userId: students[i].id,
      scanType: 'CHECK_IN',
      scannedAt: new Date(today.getFullYear(), today.getMonth(), today.getDate(), hour, minutes),
    });
  }

  // မနေ့က scan တွေ
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  for (let i = 0; i < 5; i++) {
    scanData.push({
      tagId: (await prisma.tag.findUnique({ where: { rfidCode: `RF-STU-${String(i + 1).padStart(4, '0')}` } })).id,
      deviceId: mainGate.id,
      userId: students[i].id,
      scanType: 'CHECK_IN',
      scannedAt: new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 7, 30 + i * 10),
    });
    scanData.push({
      tagId: (await prisma.tag.findUnique({ where: { rfidCode: `RF-STU-${String(i + 1).padStart(4, '0')}` } })).id,
      deviceId: mainGate.id,
      userId: students[i].id,
      scanType: 'CHECK_OUT',
      scannedAt: new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 15, 30 + i * 5),
    });
  }

  // Teacher scan
  scanData.push({
    tagId: (await prisma.tag.findUnique({ where: { rfidCode: 'RF-TCH-0001' } })).id,
    deviceId: mainGate.id,
    userId: teacher.id,
    scanType: 'CHECK_IN',
    scannedAt: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 7, 0),
  });

  for (const scan of scanData) {
    await prisma.scanLog.create({ data: scan });
  }

  console.log(`✅ Scan Logs: ${scanData.length} records created\n`);
  console.log('🎉 Seeding completed successfully!');
  console.log('\n📝 Login Credentials:');
  console.log('   Admin:   admin@gmail.com / admin123');
  console.log('   Teacher: teacher@gmail.com / teacher123');
  console.log('   Student: student1@gmail.com / student123\n');
};

seed()
  .catch((error) => {
    console.error('❌ Seed error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
