import { getPayload } from 'payload'
import config from '../../src/payload.config.js'

export const testUser = {
  email: 'e2e@zoytoy.test',
  password: 'e2e-test-only',
  roles: ['admin'] as ('admin' | 'staff')[],
}

/**
 * Seeds a test user for e2e admin tests.
 */
export async function seedTestUser(user: { email: string; roles: ('admin' | 'staff')[] } = testUser): Promise<void> {
  const payload = await getPayload({ config })

  // Delete existing test user if any
  await payload.delete({
    collection: 'users',
    where: {
      email: {
        equals: user.email,
      },
    },
  })

  // Create fresh test user
  await payload.create({
    collection: 'users',
    data: { ...testUser, ...user },
  })
}

/**
 * Cleans up test user after tests
 */
export async function cleanupTestUser(user: { email: string } = testUser): Promise<void> {
  const payload = await getPayload({ config })

  await payload.delete({
    collection: 'users',
    where: {
      email: {
        equals: user.email,
      },
    },
  })
}
