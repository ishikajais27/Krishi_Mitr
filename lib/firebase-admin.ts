import { initializeApp, getApps, cert, App } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

const getAdminApp = (): App => {
  const existing = getApps().find((a) => a.name === 'admin')
  if (existing) return existing

  const privateKey = process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.split('\\n').join('\n')
    : undefined

  try {
    return initializeApp(
      {
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey,
        }),
      },
      'admin',
    )
  } catch (e) {
    console.error('INIT ERROR:', e)
    throw e
  }
}

const adminApp = getAdminApp()

let adminAuth: ReturnType<typeof getAuth>
let adminDb: ReturnType<typeof getFirestore>

try {
  adminAuth = getAuth(adminApp)
  adminDb = getFirestore(adminApp)
  console.log('Firebase Admin initialized OK')
} catch (e) {
  console.error('getAuth/getFirestore ERROR:', e)
  throw e
}

export { adminAuth, adminDb }
