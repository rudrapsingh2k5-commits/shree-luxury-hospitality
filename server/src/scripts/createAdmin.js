import readline from 'readline';
import dotenv from 'dotenv';
dotenv.config();

import { connectDB, disconnectDB } from '../config/db.js';
import { User, AuditLog } from '../models/index.js';

const parseArgs = () => {
  const args = process.argv.slice(2);
  const parsed = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].substring(2);
      const next = args[i + 1];
      if (next && !next.startsWith('--')) {
        parsed[key] = next;
        i++;
      } else {
        parsed[key] = true;
      }
    }
  }
  return parsed;
};

const promptInput = (question) => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
};

export const provisionAdministrator = async ({ email, password, name, phone, promoteIfExisting = false }) => {
  if (!email || !/\S+@\S+\.\S+/.test(email)) {
    throw new Error('A valid email address is required to provision an administrator.');
  }

  if (!password || password.length < 8) {
    throw new Error('Administrator password must be at least 8 characters long.');
  }

  const existing = await User.findOne({ email: email.toLowerCase().trim() });
  if (existing) {
    if (existing.role === 'admin') {
      console.log(`[Admin Provisioning] Notice: Account "${existing.email}" is already an active platform administrator. Existing account preserved without changes.`);
      return { success: true, user: existing, alreadyExisted: true };
    }

    if (!promoteIfExisting) {
      throw new Error(
        `An account with email "${email}" already exists with role "${existing.role}". ` +
        `Refusing to silently overwrite or change credentials. Use --promote flag to elevate existing account role.`
      );
    }

    existing.role = 'admin';
    existing.isActive = true;
    existing.isEmailVerified = true;
    await existing.save();

    await AuditLog.create({
      userId: existing._id,
      userRole: 'admin',
      action: 'ADMIN_PROMOTED_VIA_CLI',
      entityType: 'User',
      entityId: existing._id.toString(),
      details: { email: existing.email },
    });

    console.log(`[Admin Provisioning] Success: Elevated account "${existing.email}" to platform administrator.`);
    return { success: true, user: existing, promoted: true };
  }

  const admin = await User.create({
    name: name || 'Platform Administrator',
    email: email.toLowerCase().trim(),
    password,
    phone: phone || '',
    role: 'admin',
    isActive: true,
    isEmailVerified: true,
  });

  await AuditLog.create({
    userId: admin._id,
    userRole: 'admin',
    action: 'ADMIN_PROVISIONED_VIA_CLI',
    entityType: 'User',
    entityId: admin._id.toString(),
    details: { email: admin.email },
  });

  console.log(`[Admin Provisioning] Success: Created new platform administrator account "${admin.email}".`);
  return { success: true, user: admin, created: true };
};

const main = async () => {
  const args = parseArgs();

  console.log('==================================================');
  console.log('  SHREE श्री — Trusted Administrator Provisioning  ');
  console.log('==================================================');

  let email = args.email;
  let password = args.password;
  let name = args.name;
  let phone = args.phone;
  const promote = Boolean(args.promote);

  const isNonInteractive = Boolean(args.email && args.password);
  if (!email) {
    email = await promptInput('Enter Administrator Email Address: ');
  }
  if (!password) {
    password = await promptInput('Enter Administrator Password (min 8 chars): ');
  }
  if (!name) {
    if (isNonInteractive) {
      name = 'Platform Administrator';
    } else {
      name = (await promptInput('Enter Administrator Full Name (optional): ')) || 'Platform Administrator';
    }
  }

  try {
    await connectDB();
    await provisionAdministrator({ email, password, name, phone, promoteIfExisting: promote });
    await disconnectDB();
    console.log('Administrator provisioning complete.');
    process.exit(0);
  } catch (err) {
    console.error(`\n[Admin Provisioning Failed]: ${err.message}\n`);
    await disconnectDB().catch(() => {});
    process.exit(1);
  }
};

if (process.argv[1]?.endsWith('createAdmin.js')) {
  main();
}
