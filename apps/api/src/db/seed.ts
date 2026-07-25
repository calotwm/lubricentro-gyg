import { db } from './index.js';
import { brands, categories, users } from '../db/schema/index.js';
import { hashPassword } from '../lib/password.js';

async function seed() {
  console.log('Seeding database...');

  // Create default admin user
  const adminPassword = await hashPassword('admin123');
  const [admin] = await db
    .insert(users)
    .values({
      username: 'admin',
      email: 'admin@lubricentrogyg.com',
      passwordHash: adminPassword,
      role: 'admin',
    })
    .returning();
  console.log(`Created admin user: ${admin.username} (${admin.id})`);

  // Create default employee user
  const employeePassword = await hashPassword('employee123');
  const [employee] = await db
    .insert(users)
    .values({
      username: 'employee',
      email: 'employee@lubricentrogyg.com',
      passwordHash: employeePassword,
      role: 'employee',
    })
    .returning();
  console.log(`Created employee user: ${employee.username} (${employee.id})`);

  // Create categories
  const categoryNames = ['motor-oil', 'filter', 'battery', 'general'] as const;
  for (const name of categoryNames) {
    const [category] = await db
      .insert(categories)
      .values({
        name,
        config: {
          fields: getCategoryFields(name),
          stockTracked: true,
        },
      })
      .returning();
    console.log(`Created category: ${category.name} (${category.id})`);
  }

  // Create sample brands
  const brandNames = ['Castrol', 'Mobil', 'Fram', 'Bosch', 'ACDelco', 'Valvoline'];
  for (const name of brandNames) {
    const [brand] = await db
      .insert(brands)
      .values({ name })
      .returning();
    console.log(`Created brand: ${brand.name} (${brand.id})`);
  }

  console.log('Seed complete!');
  console.log('');
  console.log('Default credentials:');
  console.log('  Admin:    admin / admin123');
  console.log('  Employee: employee / employee123');

  process.exit(0);
}

function getCategoryFields(category: string): string[] {
  switch (category) {
    case 'motor-oil':
      return ['viscosity', 'capacity', 'api_grade'];
    case 'filter':
      return ['cross_refs'];
    case 'battery':
      return ['cca', 'voltage', 'ah', 'dimensions'];
    case 'general':
      return [];
    default:
      return [];
  }
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
