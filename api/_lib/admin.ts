// api/_lib/admin.ts
import * as admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FB_PROJECT_ID,
      clientEmail: process.env.FB_CLIENT_EMAIL,
      // MUY IMPORTANTE: en Vercel la guardaste con saltos como \n
     privateKey: process.env.FB_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    } as admin.ServiceAccount),
  });
}

export const dbAdmin = admin.firestore();
export const FieldValue = admin.firestore.FieldValue;
