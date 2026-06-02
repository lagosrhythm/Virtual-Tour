var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/server/db/firestore.ts
var firestore_exports = {};
__export(firestore_exports, {
  COLLECTIONS: () => COLLECTIONS,
  getFirestore: () => getFirestore,
  getRealtimeDB: () => getRealtimeDB,
  initializeFirebase: () => initializeFirebase
});
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getDatabase as getRTDB } from "firebase-admin/database";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
function initializeFirebase() {
  if (rtdb) {
    return { rtdb };
  }
  try {
    let serviceAccountKey;
    const keyFilePath = path.join(projectRoot, "lagos-rhythm-virtual-tour-firebase-adminsdk-fbsvc-6c40080af4.json");
    if (fs.existsSync(keyFilePath)) {
      try {
        const keyFileContent = fs.readFileSync(keyFilePath, "utf-8");
        serviceAccountKey = JSON.parse(keyFileContent);
        console.log("\u2713 Loaded Firebase credentials from local file");
      } catch (error) {
        throw new Error(`Failed to read/parse Firebase key file at ${keyFilePath}: ${error instanceof Error ? error.message : error}`);
      }
    } else {
      const serviceAccountKeyStr = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
      if (!serviceAccountKeyStr) {
        throw new Error("Firebase credentials missing.");
      }
      try {
        serviceAccountKey = JSON.parse(serviceAccountKeyStr);
      } catch {
        const decoded = Buffer.from(serviceAccountKeyStr, "base64").toString("utf-8");
        serviceAccountKey = JSON.parse(decoded);
      }
    }
    if (getApps().length === 0) {
      initializeApp({
        credential: cert(serviceAccountKey),
        databaseURL: `https://${serviceAccountKey.project_id}-default-rtdb.firebaseio.com`
      });
    }
    rtdb = getRTDB();
    console.log("\u2713 Firebase initialized successfully (Realtime Database Only)");
    return { rtdb };
  } catch (error) {
    console.error("\u2717 Failed to initialize Firebase:", error instanceof Error ? error.message : error);
    throw error;
  }
}
function getRealtimeDB() {
  if (!rtdb) return initializeFirebase().rtdb;
  return rtdb;
}
function getFirestore() {
  return getRealtimeDB();
}
var __dirname, projectRoot, rtdb, COLLECTIONS;
var init_firestore = __esm({
  "src/server/db/firestore.ts"() {
    __dirname = path.dirname(fileURLToPath(import.meta.url));
    projectRoot = path.resolve(__dirname, "../../..");
    rtdb = null;
    COLLECTIONS = {
      users: "users",
      stream_providers: "stream_providers",
      live_tours: "live_tours",
      catalog_tours: "catalog_tours",
      recommended_tours: "recommended_tours",
      tour_requests: "tour_requests",
      newsletter_subscribers: "newsletter_subscribers",
      viewer_events: "viewer_events",
      operation_logs: "operation_logs"
    };
  }
});

// src/server/db/services.ts
var services_exports = {};
__export(services_exports, {
  addNewsletterSubscriber: () => addNewsletterSubscriber,
  createCatalogTour: () => createCatalogTour,
  createLiveTour: () => createLiveTour,
  createRecommendedTour: () => createRecommendedTour,
  createStreamProvider: () => createStreamProvider,
  createTourRequest: () => createTourRequest,
  deleteCatalogTour: () => deleteCatalogTour,
  deleteRecommendedTour: () => deleteRecommendedTour,
  deleteStreamProvider: () => deleteStreamProvider,
  getActiveLiveTour: () => getActiveLiveTour,
  getAnalyticsSummary: () => getAnalyticsSummary,
  getCatalogTours: () => getCatalogTours,
  getLiveTourHistory: () => getLiveTourHistory,
  getNewsletterSubscribers: () => getNewsletterSubscribers,
  getOperationLogs: () => getOperationLogs,
  getRecommendedTours: () => getRecommendedTours,
  getStreamProvider: () => getStreamProvider,
  getStreamProviders: () => getStreamProviders,
  getTourRequests: () => getTourRequests,
  unsubscribeNewsletterSubscriber: () => unsubscribeNewsletterSubscriber,
  updateCatalogTour: () => updateCatalogTour,
  updateLiveTour: () => updateLiveTour,
  updateRecommendedTour: () => updateRecommendedTour,
  updateStreamProvider: () => updateStreamProvider,
  updateTourRequestStatus: () => updateTourRequestStatus,
  writeOperationLog: () => writeOperationLog,
  writeViewerSnapshot: () => writeViewerSnapshot
});
function toArray(obj) {
  if (!obj) return [];
  return Object.keys(obj).map((key) => ({
    ...obj[key],
    // Handle potential Date objects that were stored as strings
    createdAt: obj[key].createdAt ? new Date(obj[key].createdAt) : void 0,
    updatedAt: obj[key].updatedAt ? new Date(obj[key].updatedAt) : void 0,
    timestamp: obj[key].timestamp ? new Date(obj[key].timestamp) : void 0
  }));
}
async function createStreamProvider(provider) {
  const db = getRealtimeDB();
  const ref = db.ref(COLLECTIONS.stream_providers).push();
  const now = /* @__PURE__ */ new Date();
  const streamProvider = {
    id: ref.key,
    ...provider,
    createdAt: now
  };
  await ref.set({
    ...streamProvider,
    createdAt: now.toISOString()
  });
  return streamProvider;
}
async function getStreamProvider(id) {
  const db = getRealtimeDB();
  const snapshot = await db.ref(COLLECTIONS.stream_providers).child(id).get();
  if (!snapshot.exists()) return null;
  const data = snapshot.val();
  return { ...data, createdAt: new Date(data.createdAt) };
}
async function getStreamProviders() {
  const db = getRealtimeDB();
  const snapshot = await db.ref(COLLECTIONS.stream_providers).get();
  return toArray(snapshot.val()).sort(
    (a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0)
  );
}
async function updateStreamProvider(id, updates) {
  const db = getRealtimeDB();
  await db.ref(COLLECTIONS.stream_providers).child(id).update(updates);
}
async function deleteStreamProvider(id) {
  const db = getRealtimeDB();
  await db.ref(COLLECTIONS.stream_providers).child(id).remove();
}
async function createTourRequest(destination, email) {
  const db = getRealtimeDB();
  const ref = db.ref(COLLECTIONS.tour_requests).push();
  const now = /* @__PURE__ */ new Date();
  const request = {
    id: ref.key,
    destination,
    email,
    status: "new",
    createdAt: now,
    updatedAt: now
  };
  await ref.set({
    ...request,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString()
  });
  return request;
}
async function getTourRequests(limit = 100, status) {
  const db = getRealtimeDB();
  let query = db.ref(COLLECTIONS.tour_requests).orderByChild("createdAt").limitToLast(limit);
  const snapshot = await query.get();
  let results = toArray(snapshot.val());
  if (status) {
    results = results.filter((r) => r.status === status);
  }
  return results.reverse();
}
async function updateTourRequestStatus(id, status) {
  const db = getRealtimeDB();
  await db.ref(COLLECTIONS.tour_requests).child(id).update({
    status,
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  });
}
async function addNewsletterSubscriber(email, source = "other") {
  const db = getRealtimeDB();
  const normalizedEmail = email.toLowerCase().replace(/\./g, ",");
  const ref = db.ref(COLLECTIONS.newsletter_subscribers).child(normalizedEmail);
  const snapshot = await ref.get();
  if (snapshot.exists()) {
    const existing = snapshot.val();
    if (!existing.subscribed) {
      await ref.update({
        subscribed: true,
        unsubscribedAt: null,
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      });
    }
    return existing;
  }
  const now = /* @__PURE__ */ new Date();
  const subscriber = {
    id: normalizedEmail,
    email: email.toLowerCase(),
    source,
    subscribed: true,
    createdAt: now
  };
  await ref.set({
    ...subscriber,
    createdAt: now.toISOString()
  });
  return subscriber;
}
async function getNewsletterSubscribers(limit = 1e3) {
  const db = getRealtimeDB();
  const snapshot = await db.ref(COLLECTIONS.newsletter_subscribers).orderByChild("subscribed").equalTo(true).limitToLast(limit).get();
  return toArray(snapshot.val()).reverse();
}
async function unsubscribeNewsletterSubscriber(email) {
  const db = getRealtimeDB();
  const normalizedEmail = email.toLowerCase().replace(/\./g, ",");
  await db.ref(COLLECTIONS.newsletter_subscribers).child(normalizedEmail).update({
    subscribed: false,
    unsubscribedAt: (/* @__PURE__ */ new Date()).toISOString(),
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  });
}
async function getRecommendedTours(limit = 100) {
  const db = getRealtimeDB();
  const snapshot = await db.ref(COLLECTIONS.recommended_tours).orderByChild("rank").limitToFirst(limit).get();
  return toArray(snapshot.val());
}
async function createRecommendedTour(tour) {
  const db = getRealtimeDB();
  const ref = db.ref(COLLECTIONS.recommended_tours).push();
  const now = /* @__PURE__ */ new Date();
  const recommended = {
    id: ref.key,
    ...tour,
    createdAt: now,
    updatedAt: now
  };
  await ref.set({
    ...recommended,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString()
  });
  return recommended;
}
async function updateRecommendedTour(id, updates) {
  const db = getRealtimeDB();
  await db.ref(COLLECTIONS.recommended_tours).child(id).update({
    ...updates,
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  });
}
async function deleteRecommendedTour(id) {
  const db = getRealtimeDB();
  await db.ref(COLLECTIONS.recommended_tours).child(id).remove();
}
async function getActiveLiveTour() {
  const db = getRealtimeDB();
  const snapshot = await db.ref(COLLECTIONS.live_tours).orderByChild("status").equalTo("live").limitToFirst(1).get();
  if (!snapshot.exists()) return null;
  return toArray(snapshot.val())[0];
}
async function createLiveTour(tour) {
  const db = getRealtimeDB();
  const ref = db.ref(COLLECTIONS.live_tours).push();
  const now = /* @__PURE__ */ new Date();
  const liveTour = {
    id: ref.key,
    ...tour,
    viewerCount: 0,
    createdAt: now,
    updatedAt: now
  };
  await ref.set({
    ...liveTour,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString()
  });
  return liveTour;
}
async function updateLiveTour(id, updates) {
  const db = getRealtimeDB();
  await db.ref(COLLECTIONS.live_tours).child(id).update({
    ...updates,
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  });
}
async function getLiveTourHistory(limit = 50) {
  const db = getRealtimeDB();
  const snapshot = await db.ref(COLLECTIONS.live_tours).orderByChild("createdAt").limitToLast(limit).get();
  return toArray(snapshot.val()).reverse();
}
async function getCatalogTours(limit = 100) {
  const db = getRealtimeDB();
  const snapshot = await db.ref(COLLECTIONS.catalog_tours).orderByChild("visibility").equalTo("public").limitToLast(limit).get();
  return toArray(snapshot.val()).reverse();
}
async function createCatalogTour(tour) {
  const db = getRealtimeDB();
  const ref = db.ref(COLLECTIONS.catalog_tours).push();
  const now = /* @__PURE__ */ new Date();
  const catalogTour = {
    id: ref.key,
    ...tour,
    createdAt: now,
    updatedAt: now
  };
  await ref.set({
    ...catalogTour,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString()
  });
  return catalogTour;
}
async function updateCatalogTour(id, updates) {
  const db = getRealtimeDB();
  await db.ref(COLLECTIONS.catalog_tours).child(id).update({
    ...updates,
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  });
}
async function deleteCatalogTour(id) {
  const db = getRealtimeDB();
  await db.ref(COLLECTIONS.catalog_tours).child(id).remove();
}
async function writeOperationLog(log) {
  try {
    const db = getRealtimeDB();
    const ref = db.ref(COLLECTIONS.operation_logs).push();
    await ref.set({ ...log, id: ref.key, timestamp: (/* @__PURE__ */ new Date()).toISOString() });
  } catch {
  }
}
async function getOperationLogs(limit = 100) {
  const db = getRealtimeDB();
  const snapshot = await db.ref(COLLECTIONS.operation_logs).orderByChild("timestamp").limitToLast(limit).get();
  return toArray(snapshot.val()).reverse();
}
async function writeViewerSnapshot(tourId, viewerCount) {
  try {
    const db = getRealtimeDB();
    const ref = db.ref("viewer_snapshots").push();
    await ref.set({
      id: ref.key,
      tourId,
      viewerCount,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  } catch (error) {
    console.error("Failed to write RTDB snapshot:", error);
  }
}
async function getAnalyticsSummary() {
  const db = getRealtimeDB();
  const [reqSnap, subSnap, tourSnap, logSnap] = await Promise.all([
    db.ref(COLLECTIONS.tour_requests).get(),
    db.ref(COLLECTIONS.newsletter_subscribers).get(),
    db.ref(COLLECTIONS.live_tours).get(),
    db.ref(COLLECTIONS.operation_logs).orderByChild("timestamp").limitToLast(20).get()
  ]);
  const reqs = toArray(reqSnap.val());
  const subs = toArray(subSnap.val()).filter((s) => s.subscribed);
  const tours = toArray(tourSnap.val());
  const logs = toArray(logSnap.val()).reverse();
  let totalViewers = 0;
  tours.forEach((t) => {
    totalViewers += t.viewerCount || 0;
  });
  return {
    totalTourRequests: reqs.length,
    totalSubscribers: subs.length,
    totalLiveTours: tours.length,
    totalViewers,
    avgViewers: tours.length > 0 ? Math.round(totalViewers / tours.length) : 0,
    recentLogs: logs
  };
}
var init_services = __esm({
  "src/server/db/services.ts"() {
    init_firestore();
  }
});

// server.ts
import "dotenv/config";
import crypto from "node:crypto";
import http from "node:http";
import path2 from "node:path";
import { fileURLToPath as fileURLToPath2 } from "node:url";
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

// src/data/liveTour.ts
var OFFLINE_TOUR_STATUS = {
  isLive: false,
  viewerCount: 0,
  tour: null
};

// src/data/recommendedTours.ts
var RECOMMENDED_TOURS = [
  {
    id: 1,
    title: "Badagry Heritage Trail Live",
    time: "Tomorrow, 2:00 PM (WAT)",
    host: "Amina",
    tags: ["History", "Culture"],
    img: "https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=600&q=80",
    rank: 1
  },
  {
    id: 2,
    title: "Balogun Market Hustle",
    time: "Friday, 10:00 AM (WAT)",
    host: "Tolu",
    tags: ["Market", "Street"],
    img: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80",
    rank: 2
  },
  {
    id: 3,
    title: "Victoria Island Night Walk",
    time: "Saturday, 8:00 PM (WAT)",
    host: "David",
    tags: ["Nightlife", "City"],
    img: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=600&q=80",
    rank: 3
  }
];

// server.ts
init_firestore();
init_services();

// src/server/db/seed.ts
init_firestore();

// src/constants.ts
var TOURS = [
  { id: 1, title: "The Great Lagos Market Dive", imgClass: "bg-[url('https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=80')]", category: "Culture", duration: "45m", views: "124k", trend: "+3.2k this week", isFree: true },
  { id: 2, title: "Lekki Conservation Centre Canopy Walk", imgClass: "bg-[url('https://images.unsplash.com/photo-1448375240586-882707db888b?w=600&q=80')]", category: "Nature", duration: "1h 15m", views: "280k", trend: "+15k this week", isFree: true },
  { id: 3, title: "Nightlife at Victoria Island", imgClass: "bg-[url('https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=600&q=80')]", category: "Entertainment", duration: "2h", views: "450k", trend: "+22k this week", isFree: true },
  { id: 4, title: "Historical Tour of Badagry", imgClass: "bg-[url('https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=600&q=80')]", category: "History", duration: "1h 30m", views: "85k", trend: "+1.1k this week", isFree: true },
  { id: 5, title: "Tarkwa Bay Beach Day", imgClass: "bg-[url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80')]", category: "Relaxation", duration: "3h", views: "210k", trend: "+4k this week", isFree: true },
  { id: 6, title: "Makoko Floating Village", imgClass: "bg-[url('https://images.unsplash.com/photo-1576089073624-b5751a8f4e3b?w=600&q=80')]", category: "Culture", duration: "50m", views: "320k", trend: "+9k this week", isFree: true },
  { id: 7, title: "National Museum Virtual Walk", imgClass: "bg-[url('https://images.unsplash.com/photo-1554907984-15263bfd63bd?w=600&q=80')]", category: "History", duration: "1h", views: "95k", trend: "+2k this week", isFree: true },
  { id: 8, title: "Eko Atlantic City Drive", imgClass: "bg-[url('https://images.unsplash.com/photo-1558618047-f4e60cefab14?w=600&q=80')]", category: "Modern", duration: "40m", views: "150k", trend: "+5k this week", isFree: true }
];

// src/server/db/seed.ts
async function seedRecommendedTours() {
  try {
    const db = getRealtimeDB();
    const ref = db.ref(COLLECTIONS.recommended_tours);
    const existing = await ref.limitToFirst(1).get();
    if (existing.exists()) {
      console.log("\u2713 Recommended tours already seeded (RTDB), skipping.");
      return;
    }
    console.log("Seeding recommended tours to RTDB...");
    const now = (/* @__PURE__ */ new Date()).toISOString();
    for (const tour of RECOMMENDED_TOURS) {
      const newRef = ref.push();
      await newRef.set({
        ...tour,
        id: newRef.key,
        createdAt: now,
        updatedAt: now
      });
    }
    console.log(`\u2713 Seeded ${RECOMMENDED_TOURS.length} recommended tours to RTDB`);
  } catch (error) {
    console.warn("Could not seed recommended tours to RTDB:", error instanceof Error ? error.message : error);
  }
}
async function seedCatalogTours() {
  try {
    const db = getRealtimeDB();
    const ref = db.ref(COLLECTIONS.catalog_tours);
    const existing = await ref.limitToFirst(1).get();
    if (existing.exists()) {
      console.log("\u2713 Catalog tours already seeded (RTDB), skipping.");
      return;
    }
    console.log("Seeding catalog tours to RTDB...");
    const now = (/* @__PURE__ */ new Date()).toISOString();
    for (const tour of TOURS) {
      const newRef = ref.push();
      const imageUrl = tour.imgClass.match(/url\('(.+?)'\)/)?.[1] ?? "";
      await newRef.set({
        id: newRef.key,
        title: tour.title,
        category: tour.category,
        duration: tour.duration,
        description: "",
        imageUrl,
        free: tour.isFree ?? true,
        views: tour.views,
        trend: tour.trend ?? "",
        visibility: "public",
        createdAt: now,
        updatedAt: now
      });
    }
    console.log(`\u2713 Seeded ${TOURS.length} catalog tours to RTDB`);
  } catch (error) {
    console.warn("Could not seed catalog tours to RTDB:", error instanceof Error ? error.message : error);
  }
}
async function initializeFirestoreData() {
  try {
    await seedRecommendedTours();
    await seedCatalogTours();
    console.log("\u2713 Realtime Database initialization complete");
  } catch (error) {
    console.error("Error initializing RTDB:", error);
    throw error;
  }
}

// src/server/auth/middleware.ts
import * as admin from "firebase-admin";

// src/server/auth/users.ts
init_firestore();
async function upsertUser(uid, email, role = "viewer", displayName) {
  const db = getFirestore();
  const now = /* @__PURE__ */ new Date();
  const user = {
    id: uid,
    email,
    role,
    displayName: displayName || email.split("@")[0],
    createdAt: now
  };
  await db.collection(COLLECTIONS.users).doc(uid).set(user, { merge: true });
  return user;
}
async function getUserById(uid) {
  const db = getFirestore();
  const doc = await db.collection(COLLECTIONS.users).doc(uid).get();
  if (!doc.exists) {
    return null;
  }
  return doc.data();
}
async function getAllAdmins() {
  const db = getFirestore();
  const query = await db.collection(COLLECTIONS.users).where("role", "==", "admin").get();
  return query.docs.map((doc) => doc.data());
}

// src/server/auth/middleware.ts
async function verifyFirebaseToken(req2, _res, next) {
  const authHeader = req2.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    next();
    return;
  }
  try {
    const token = authHeader.substring(7);
    const decodedToken = await admin.auth().verifyIdToken(token);
    const user = await getUserById(decodedToken.uid);
    if (!user) {
      next();
      return;
    }
    req2.user = {
      uid: decodedToken.uid,
      email: decodedToken.email || user.email,
      role: user.role
    };
    next();
  } catch (error) {
    console.warn("Token verification failed:", error instanceof Error ? error.message : error);
    next();
  }
}
function requireAuth(req2, res, next) {
  if (!req2.user) {
    res.status(401).json({ error: "Unauthorized: Please log in." });
    return;
  }
  next();
}
function requireAdmin(req2, res, next) {
  if (!req2.user) {
    res.status(401).json({ error: "Unauthorized: Please log in." });
    return;
  }
  if (req2.user.role !== "admin") {
    res.status(403).json({ error: "Forbidden: Admin access required." });
    return;
  }
  next();
}

// server.ts
var __dirname2 = path2.dirname(fileURLToPath2(import.meta.url));
var app = express();
var port = Number(process.env.PORT || 3e3);
try {
  initializeFirebase();
} catch (error) {
  console.error("WARNING: Firebase initialization failed. API endpoints will use fallback data.");
}
var currentLiveTourId = null;
var sockets = /* @__PURE__ */ new Set();
app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      "default-src": ["'self'"],
      "script-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      "font-src": ["'self'", "https://fonts.gstatic.com"],
      "img-src": ["'self'", "data:", "https://images.unsplash.com", "https://firebasestorage.googleapis.com", "*.googleusercontent.com"],
      "frame-src": ["'self'", "https://www.youtube.com", "https://youtube.com"],
      "connect-src": ["'self'", "*.googleapis.com", "wss:", "ws:"]
    }
  }
}));
app.use(express.json({ limit: "32kb" }));
var publicFormLimiter = rateLimit({
  windowMs: 15 * 60 * 1e3,
  // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please try again later." }
});
app.use(verifyFirebaseToken);
function jsonOk(data) {
  return { data };
}
function isEmail(value) {
  return typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
function sanitise(value, maxLen = 500) {
  if (typeof value !== "string") return "";
  return value.replace(/<[^>]*>/g, "").replace(/\0/g, "").trim().slice(0, maxLen);
}
async function getTourStatus() {
  try {
    const isLive = process.env.LIVE_TOUR_ACTIVE === "true";
    if (!isLive) {
      return OFFLINE_TOUR_STATUS;
    }
    try {
      const activeTour = await getActiveLiveTour();
      if (activeTour) {
        currentLiveTourId = activeTour.id;
        let streamProvider = null;
        try {
          streamProvider = await getStreamProvider(activeTour.streamProviderId);
        } catch (err) {
          console.warn("Could not fetch stream provider:", err instanceof Error ? err.message : err);
        }
        return {
          isLive: true,
          viewerCount: activeTour.viewerCount,
          tour: {
            title: activeTour.title,
            shortDescription: activeTour.shortDescription,
            hostName: activeTour.hostName,
            startedAtLabel: "Live now",
            location: activeTour.location,
            streamImageUrl: activeTour.metadata?.imageUrl,
            hostImageUrl: activeTour.metadata?.hostImageUrl
          },
          streamProvider: streamProvider ? {
            type: streamProvider.type,
            name: streamProvider.name,
            config: streamProvider.config
          } : void 0
        };
      }
    } catch (error) {
      console.warn("Could not fetch from Firestore, using env vars:", error instanceof Error ? error.message : error);
    }
    return {
      isLive: true,
      viewerCount: Number(process.env.LIVE_TOUR_VIEWERS || 1245),
      tour: {
        title: process.env.LIVE_TOUR_TITLE || "Live tour",
        shortDescription: process.env.LIVE_TOUR_DESCRIPTION || "A live Lagos virtual tour is currently broadcasting.",
        hostName: process.env.LIVE_TOUR_HOST || "Lagos Rhythm",
        startedAtLabel: process.env.LIVE_TOUR_STARTED_LABEL || "Live now",
        location: process.env.LIVE_TOUR_LOCATION || "Lagos, Nigeria",
        streamImageUrl: process.env.LIVE_TOUR_STREAM_IMAGE,
        hostImageUrl: process.env.LIVE_TOUR_HOST_IMAGE
      }
    };
  } catch (error) {
    console.error("Error in getTourStatus:", error);
    return OFFLINE_TOUR_STATUS;
  }
}
app.get("/api/health", (_req, res) => {
  res.json(jsonOk({ ok: true }));
});
app.post("/admin/login", async (req2, res) => {
  try {
    const token = typeof req2.body?.token === "string" ? req2.body.token.trim() : "";
    if (!token) {
      res.status(400).json({ error: "Firebase ID token is required." });
      return;
    }
    if (!req2.user) {
      res.status(401).json({ error: "Invalid or expired token." });
      return;
    }
    const user = await getUserById(req2.user.uid);
    if (!user) {
      res.status(404).json({ error: "User not found. Contact admin to set up account." });
      return;
    }
    res.json(jsonOk({ uid: user.id, email: user.email, role: user.role }));
  } catch (error) {
    console.error("Error in /admin/login:", error);
    res.status(500).json({ error: "Login failed" });
  }
});
app.post("/admin/register", async (req2, res) => {
  try {
    const token = typeof req2.body?.token === "string" ? req2.body.token.trim() : "";
    if (!token) {
      res.status(400).json({ error: "Firebase ID token is required." });
      return;
    }
    if (!req2.user) {
      res.status(401).json({ error: "Invalid or expired token." });
      return;
    }
    const existingAdmins = await getAllAdmins();
    if (existingAdmins.length > 0) {
      res.status(403).json({ error: "Admin registration has already been completed." });
      return;
    }
    const user = await upsertUser(req2.user.uid, req2.user.email, "admin");
    res.status(201).json(jsonOk({ uid: user.id, email: user.email, role: user.role }));
  } catch (error) {
    console.error("Error in /admin/register:", error);
    res.status(500).json({ error: "Registration failed" });
  }
});
app.get("/admin/me", requireAuth, async (req2, res) => {
  try {
    if (!req2.user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }
    const user = await getUserById(req2.user.uid);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json(jsonOk({ uid: user.id, email: user.email, role: user.role }));
  } catch (error) {
    console.error("Error in /admin/me:", error);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});
app.post("/admin/streams", requireAdmin, async (req2, res) => {
  try {
    const { type, name, config } = req2.body;
    if (!["youtube", "mux", "cloudflare", "manual_hls", "browser_webrtc"].includes(type)) {
      res.status(400).json({ error: "Invalid stream provider type." });
      return;
    }
    if (!name || typeof name !== "string" || name.trim().length < 1) {
      res.status(400).json({ error: "Stream provider name is required." });
      return;
    }
    const provider = await createStreamProvider({
      type,
      name: name.trim(),
      config: config || {}
    });
    res.status(201).json(jsonOk(provider));
  } catch (error) {
    console.error("Error creating stream provider:", error);
    res.status(500).json({ error: "Failed to create stream provider" });
  }
});
app.get("/admin/streams", requireAdmin, async (_req, res) => {
  try {
    const providers = await getStreamProviders();
    res.json(jsonOk(providers));
  } catch (error) {
    console.error("Error fetching stream providers:", error);
    res.status(500).json({ error: "Failed to fetch stream providers" });
  }
});
app.put("/admin/streams/:id", requireAdmin, async (req2, res) => {
  try {
    const { id } = req2.params;
    const { type, name, config } = req2.body;
    const provider = await getStreamProvider(id);
    if (!provider) {
      res.status(404).json({ error: "Stream provider not found." });
      return;
    }
    const updates = {};
    if (type) {
      if (!["youtube", "mux", "cloudflare", "manual_hls", "browser_webrtc"].includes(type)) {
        res.status(400).json({ error: "Invalid stream provider type." });
        return;
      }
      updates.type = type;
    }
    if (name) {
      updates.name = name.trim();
    }
    if (config) {
      updates.config = config;
    }
    await updateStreamProvider(id, updates);
    res.json(jsonOk({ ok: true }));
  } catch (error) {
    console.error("Error updating stream provider:", error);
    res.status(500).json({ error: "Failed to update stream provider" });
  }
});
app.delete("/admin/streams/:id", requireAdmin, async (_req, res) => {
  try {
    const { id } = _req.params;
    const provider = await getStreamProvider(id);
    if (!provider) {
      res.status(404).json({ error: "Stream provider not found." });
      return;
    }
    await deleteStreamProvider(id);
    res.json(jsonOk({ ok: true }));
  } catch (error) {
    console.error("Error deleting stream provider:", error);
    res.status(500).json({ error: "Failed to delete stream provider" });
  }
});
app.post("/admin/tours", requireAuth, async (req2, res) => {
  try {
    if (!req2.user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }
    const { streamProviderId, title, shortDescription, hostName, location, metadata } = req2.body;
    if (!streamProviderId || typeof streamProviderId !== "string") {
      res.status(400).json({ error: "Stream provider ID is required." });
      return;
    }
    if (!title || typeof title !== "string" || title.trim().length < 1) {
      res.status(400).json({ error: "Tour title is required." });
      return;
    }
    const provider = await getStreamProvider(streamProviderId);
    if (!provider) {
      res.status(404).json({ error: "Stream provider not found." });
      return;
    }
    const tour = await createLiveTour({
      streamProviderId,
      title: title.trim(),
      shortDescription: (shortDescription || "").trim(),
      hostName: (hostName || "Host").trim(),
      hostId: req2.user.uid,
      location: (location || "").trim(),
      status: "draft",
      metadata: metadata || {}
    });
    res.status(201).json(jsonOk(tour));
  } catch (error) {
    console.error("Error creating live tour:", error);
    res.status(500).json({ error: "Failed to create live tour" });
  }
});
app.get("/admin/tours", requireAuth, async (_req, res) => {
  try {
    const tours = await getLiveTourHistory(100);
    res.json(jsonOk(tours));
  } catch (error) {
    console.error("Error fetching live tours:", error);
    res.status(500).json({ error: "Failed to fetch live tours" });
  }
});
app.put("/admin/tours/:id", requireAuth, async (_req, res) => {
  try {
    const { id } = _req.params;
    const { title, shortDescription, hostName, location, status, metadata } = _req.body;
    const updates = {};
    if (title) {
      updates.title = title.trim();
    }
    if (shortDescription !== void 0) {
      updates.shortDescription = (shortDescription || "").trim();
    }
    if (hostName) {
      updates.hostName = hostName.trim();
    }
    if (location !== void 0) {
      updates.location = (location || "").trim();
    }
    if (status) {
      if (!["draft", "scheduled", "live", "ended"].includes(status)) {
        res.status(400).json({ error: "Invalid tour status." });
        return;
      }
      updates.status = status;
    }
    if (metadata) {
      updates.metadata = metadata;
    }
    await updateLiveTour(id, updates);
    if (req.user && status) {
      void writeOperationLog({
        userId: req.user.uid,
        action: status === "live" ? "tour_go_live" : status === "ended" ? "tour_end" : "tour_update",
        resourceType: "live_tour",
        resourceId: id,
        changes: updates,
        status: "success"
      });
    }
    res.json(jsonOk({ ok: true }));
  } catch (error) {
    console.error("Error updating live tour:", error);
    res.status(500).json({ error: "Failed to update live tour" });
  }
});
app.get("/api/catalog", async (_req, res) => {
  try {
    const tours = await getCatalogTours(100);
    res.json(jsonOk(tours));
  } catch (error) {
    console.warn("Catalog fetch failed, returning empty:", error instanceof Error ? error.message : error);
    res.json(jsonOk([]));
  }
});
app.get("/admin/catalog", requireAdmin, async (_req, res) => {
  try {
    const db = getFirestore();
    const snapshot = await db.collection("catalog_tours").orderBy("createdAt", "desc").limit(200).get();
    res.json(jsonOk(snapshot.docs.map((d) => d.data())));
  } catch (error) {
    console.error("Error fetching catalog tours:", error);
    res.status(500).json({ error: "Failed to fetch catalog tours" });
  }
});
app.post("/admin/catalog", requireAdmin, async (req2, res) => {
  try {
    const { title, category, duration, description, imageUrl, free, views, trend, visibility } = req2.body;
    if (!title || typeof title !== "string") {
      res.status(400).json({ error: "Title is required." });
      return;
    }
    const db = getFirestore();
    const docRef = db.collection("catalog_tours").doc();
    const now = /* @__PURE__ */ new Date();
    const tour = {
      id: docRef.id,
      title: title.trim(),
      category: category || "Culture",
      duration: duration || "",
      description: description || "",
      imageUrl: imageUrl || "",
      free: free !== false,
      views: views || "",
      trend: trend || "",
      visibility: visibility || "public",
      createdAt: now,
      updatedAt: now
    };
    await docRef.set(tour);
    res.status(201).json(jsonOk(tour));
  } catch (error) {
    console.error("Error creating catalog tour:", error);
    res.status(500).json({ error: "Failed to create catalog tour" });
  }
});
app.put("/admin/catalog/:id", requireAdmin, async (req2, res) => {
  try {
    const { id } = req2.params;
    const db = getFirestore();
    await db.collection("catalog_tours").doc(id).update({ ...req2.body, updatedAt: /* @__PURE__ */ new Date() });
    res.json(jsonOk({ ok: true }));
  } catch (error) {
    console.error("Error updating catalog tour:", error);
    res.status(500).json({ error: "Failed to update catalog tour" });
  }
});
app.delete("/admin/catalog/:id", requireAdmin, async (req2, res) => {
  try {
    const { id } = req2.params;
    const db = getFirestore();
    await db.collection("catalog_tours").doc(id).delete();
    res.json(jsonOk({ ok: true }));
  } catch (error) {
    console.error("Error deleting catalog tour:", error);
    res.status(500).json({ error: "Failed to delete catalog tour" });
  }
});
app.post("/admin/recommended-tours", requireAdmin, async (req2, res) => {
  try {
    const { title, host, time, tags, img, rank } = req2.body;
    if (!title || typeof title !== "string") {
      res.status(400).json({ error: "Title is required." });
      return;
    }
    const { getFirestore: getFirestore2, COLLECTIONS: COLLECTIONS2 } = await Promise.resolve().then(() => (init_firestore(), firestore_exports));
    const db = getFirestore2();
    const docRef = db.collection(COLLECTIONS2.recommended_tours).doc();
    const now = /* @__PURE__ */ new Date();
    await docRef.set({ id: docRef.id, tourId: "", title, host: host || "", time: time || "", tags: tags || [], img: img || "", rank: Number(rank) || 1, free: true, featured: false, createdAt: now, updatedAt: now });
    res.status(201).json(jsonOk({ id: docRef.id }));
  } catch (error) {
    console.error("Error creating recommended tour:", error);
    res.status(500).json({ error: "Failed to create tour" });
  }
});
app.put("/admin/recommended-tours/:id", requireAdmin, async (req2, res) => {
  try {
    const { id } = req2.params;
    const { updateRecommendedTour: updateRecommendedTour2 } = await Promise.resolve().then(() => (init_services(), services_exports));
    await updateRecommendedTour2(id, req2.body);
    res.json(jsonOk({ ok: true }));
  } catch (error) {
    console.error("Error updating recommended tour:", error);
    res.status(500).json({ error: "Failed to update tour" });
  }
});
app.delete("/admin/recommended-tours/:id", requireAdmin, async (req2, res) => {
  try {
    const { id } = req2.params;
    const { deleteRecommendedTour: deleteRecommendedTour2 } = await Promise.resolve().then(() => (init_services(), services_exports));
    await deleteRecommendedTour2(id);
    res.json(jsonOk({ ok: true }));
  } catch (error) {
    console.error("Error deleting recommended tour:", error);
    res.status(500).json({ error: "Failed to delete tour" });
  }
});
app.get("/admin/analytics", requireAdmin, async (req2, res) => {
  try {
    const summary = await getAnalyticsSummary();
    res.json(jsonOk(summary));
  } catch (error) {
    console.error("Error fetching analytics:", error);
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
});
app.get("/admin/logs", requireAdmin, async (_req, res) => {
  try {
    const logs = await getOperationLogs(200);
    res.json(jsonOk(logs));
  } catch (error) {
    console.error("Error fetching logs:", error);
    res.status(500).json({ error: "Failed to fetch logs" });
  }
});
app.get("/admin/tour-requests", requireAdmin, async (_req, res) => {
  try {
    const { getTourRequests: getTourRequests2 } = await Promise.resolve().then(() => (init_services(), services_exports));
    const requests = await getTourRequests2(200);
    res.json(jsonOk(requests));
  } catch (error) {
    console.error("Error fetching tour requests:", error);
    res.status(500).json({ error: "Failed to fetch tour requests" });
  }
});
app.put("/admin/tour-requests/:id", requireAdmin, async (req2, res) => {
  try {
    const { id } = req2.params;
    const { status } = req2.body;
    if (!["new", "reviewed", "planned", "rejected"].includes(status)) {
      res.status(400).json({ error: "Invalid status." });
      return;
    }
    const { updateTourRequestStatus: updateTourRequestStatus2 } = await Promise.resolve().then(() => (init_services(), services_exports));
    await updateTourRequestStatus2(id, status);
    res.json(jsonOk({ ok: true }));
  } catch (error) {
    console.error("Error updating tour request:", error);
    res.status(500).json({ error: "Failed to update tour request" });
  }
});
app.get("/admin/newsletter", requireAdmin, async (_req, res) => {
  try {
    const { getNewsletterSubscribers: getNewsletterSubscribers2 } = await Promise.resolve().then(() => (init_services(), services_exports));
    const subscribers = await getNewsletterSubscribers2(1e3);
    res.json(jsonOk(subscribers));
  } catch (error) {
    console.error("Error fetching subscribers:", error);
    res.status(500).json({ error: "Failed to fetch subscribers" });
  }
});
app.get("/api/recommended-tours", async (_req, res) => {
  try {
    try {
      const tours = await getRecommendedTours(100);
      if (tours.length > 0) {
        return res.json(jsonOk(tours));
      }
    } catch (error) {
      console.warn("Could not fetch from Firestore, using fallback:", error instanceof Error ? error.message : error);
    }
    res.json(jsonOk([...RECOMMENDED_TOURS].sort((a, b) => a.rank - b.rank)));
  } catch (error) {
    console.error("Error fetching recommended tours:", error);
    res.json(jsonOk([...RECOMMENDED_TOURS].sort((a, b) => a.rank - b.rank)));
  }
});
app.get("/api/tour-status", async (_req, res) => {
  try {
    const status = await getTourStatus();
    res.json(jsonOk(status));
  } catch (error) {
    console.error("Error fetching tour status:", error);
    res.json(jsonOk(OFFLINE_TOUR_STATUS));
  }
});
app.post("/api/tour-requests", publicFormLimiter, async (req2, res) => {
  try {
    const destination = sanitise(req2.body?.destination, 200);
    const email = sanitise(req2.body?.email, 254).toLowerCase();
    if (destination.length < 3) {
      res.status(400).json({ error: "Enter a destination or theme with at least 3 characters." });
      return;
    }
    if (!isEmail(email)) {
      res.status(400).json({ error: "Enter a valid email address." });
      return;
    }
    try {
      await createTourRequest(destination, email);
    } catch (error) {
      console.warn("Could not save to Firestore:", error instanceof Error ? error.message : error);
    }
    res.status(201).json(jsonOk({ ok: true }));
  } catch (error) {
    console.error("Error creating tour request:", error);
    res.status(500).json({ error: "Failed to process request" });
  }
});
app.post("/api/newsletter", publicFormLimiter, async (req2, res) => {
  try {
    const email = sanitise(req2.body?.email, 254).toLowerCase();
    if (!isEmail(email)) {
      res.status(400).json({ error: "Enter a valid email address." });
      return;
    }
    try {
      await addNewsletterSubscriber(email, "newsletter_signup");
    } catch (error) {
      console.warn("Could not save to Firestore:", error instanceof Error ? error.message : error);
    }
    res.status(201).json(jsonOk({ ok: true }));
  } catch (error) {
    console.error("Error adding newsletter subscriber:", error);
    res.status(500).json({ error: "Failed to subscribe" });
  }
});
app.use(express.static(path2.join(__dirname2, "dist")));
app.get("*", (_req, res) => {
  res.sendFile(path2.join(__dirname2, "dist", "index.html"));
});
var server = http.createServer(app);
function encodeFrame(payload) {
  const data = Buffer.from(payload);
  if (data.length < 126) {
    return Buffer.concat([Buffer.from([129, data.length]), data]);
  }
  if (data.length < 65536) {
    const header2 = Buffer.alloc(4);
    header2[0] = 129;
    header2[1] = 126;
    header2.writeUInt16BE(data.length, 2);
    return Buffer.concat([header2, data]);
  }
  const header = Buffer.alloc(10);
  header[0] = 129;
  header[1] = 127;
  header.writeBigUInt64BE(BigInt(data.length), 2);
  return Buffer.concat([header, data]);
}
async function sendStatus(socket) {
  try {
    const status = await getTourStatus();
    const viewerNoise = status.isLive ? Math.floor(Math.random() * 9) - 4 : 0;
    const payload = {
      ...status,
      viewerCount: Math.max(0, status.viewerCount + viewerNoise)
    };
    socket.write(encodeFrame(JSON.stringify(payload)));
  } catch (error) {
    console.error("Error sending status:", error);
  }
}
server.on("upgrade", (req2, socket) => {
  if (req2.url !== "/api/live") {
    socket.destroy();
    return;
  }
  const key = req2.headers["sec-websocket-key"];
  if (!key) {
    socket.destroy();
    return;
  }
  const accept = crypto.createHash("sha1").update(`${key}258EAFA5-E914-47DA-95CA-C5AB0DC85B11`).digest("base64");
  socket.write([
    "HTTP/1.1 101 Switching Protocols",
    "Upgrade: websocket",
    "Connection: Upgrade",
    `Sec-WebSocket-Accept: ${accept}`,
    "",
    ""
  ].join("\r\n"));
  sockets.add(socket);
  sendStatus(socket);
  socket.on("close", () => sockets.delete(socket));
  socket.on("error", () => sockets.delete(socket));
});
setInterval(() => {
  sockets.forEach((socket) => {
    sendStatus(socket).catch((error) => {
      console.error("Error sending status to socket:", error);
    });
  });
}, 5e3).unref();
setInterval(() => {
  if (currentLiveTourId) {
    getTourStatus().then((status) => {
      if (status.isLive && currentLiveTourId) {
        void writeViewerSnapshot(currentLiveTourId, status.viewerCount);
      }
    }).catch(() => {
    });
  }
}, 3e4).unref();
var isVercel = process.env.VERCEL === "1";
if (!isVercel) {
  app.listen(port, "0.0.0.0", async () => {
    console.log(`Lagos Rhythm listening on http://localhost:${port}`);
    try {
      await initializeFirestoreData();
    } catch (error) {
      console.warn("Failed to initialize Database data:", error instanceof Error ? error.message : error);
    }
  });
}
var server_default = app;
export {
  server_default as default
};
