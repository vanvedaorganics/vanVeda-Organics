import conf from "../conf/conf.js";
import {
  Client,
  Account,
  Databases,
  Storage,
  Query,
  ID,
  Permission,
  Role,
} from "appwrite";

export class appwriteConfigService {
  client = new Client();
  account;
  databases;
  storage;

  constructor() {
    this.client
      .setEndpoint(conf.appwriteUrl)
      .setProject(conf.appwriteProjectId);
    this.databases = new Databases(this.client);
    this.storage = new Storage(this.client);
    this.account = new Account(this.client); // keep Account active so storage uses the same authenticated session

    // Automated internal diagnostic: Test bucket connectivity
    this.testStorageConnectivity();
  }

  async testStorageConnectivity() {
    try {
      await this.storage.listFiles(conf.appwriteBucketId, [], 1);
      console.log(`[Appwrite Service] Storage connectivity confirmed for bucket: ${conf.appwriteBucketId}`);
    } catch (error) {
      if (error?.code === 403 || error?.code === 401) {
        console.error(`[Appwrite Service] STORAGE PERMISSION ERROR (403/401) for bucket: ${conf.appwriteBucketId}. Ensure the bucket has Read permissions for role 'Any'.`);
      } else {
        console.warn(`[Appwrite Service] Storage test returned code ${error?.code}: ${error?.message}`);
      }
    }
  }

  // Helper method to normalize product documentation consistently
  normalizeProductDoc(doc) {
    if (!doc) return doc;
    const parsedDoc = { ...doc };

    // 1. Normalize packaging_size (could be array of strings, array of objects, or single JSON string)
    let rawPkg = parsedDoc.packaging_size;
    if (typeof rawPkg === "string" && rawPkg.trim()) {
      try {
        const parsed = JSON.parse(rawPkg);
        if (Array.isArray(parsed)) rawPkg = parsed;
      } catch (e) {
        console.warn("[normalizeProductDoc] Failed to parse packaging_size string", e);
      }
    }

    if (Array.isArray(rawPkg)) {
      parsedDoc.packaging_size = rawPkg.map((item) => {
        if (typeof item === "string") {
          try {
            const obj = JSON.parse(item);
            return {
              id: obj?.id || Math.random().toString(36).substr(2, 9),
              size: obj?.size || "",
              price_cents: Number(obj?.price_cents) || 0,
              images: Array.isArray(obj?.images)
                ? obj.images.filter((id) => typeof id === "string" && id.trim())
                : [],
            };
          } catch {
            return { size: "", price_cents: 0, images: [] };
          }
        }
        // Already an object
        return {
          id: item?.id || item?.$id || Math.random().toString(36).substr(2, 9),
          size: item?.size || "",
          price_cents: Number(item?.price_cents) || 0,
          images: Array.isArray(item?.images)
            ? item.images.filter((id) => typeof id === "string" && id.trim())
            : [],
        };
      });
    } else {
      parsedDoc.packaging_size = [];
    }

    // NEW: Normalize top-level price_cents for legacy support
    if (parsedDoc.price_cents !== undefined) {
      parsedDoc.price_cents = Number(parsedDoc.price_cents) || 0;
    }

    // 2. Normalize batch (could be array or single stringified JSON)
    let rawBatch = parsedDoc.batch;
    if (typeof rawBatch === "string" && rawBatch.trim()) {
      try {
        const parsed = JSON.parse(rawBatch);
        if (Array.isArray(parsed)) rawBatch = parsed;
      } catch (e) {
        // Not JSON or single value
      }
    }

    if (Array.isArray(rawBatch)) {
      parsedDoc.batch = rawBatch
        .map((b) => ({
          name: String(b?.name ?? "").trim(),
          delivery_date: String(b?.delivery_date ?? "").trim(),
        }))
        .filter((b) => b.name || b.delivery_date);
    } else {
      parsedDoc.batch = [];
    }

    return parsedDoc;
  }

  async createProduct({
    slug,
    name,
    description,
    sku,
    categories = null,
    packaging_size = [],
    currency = "INR",
    discount = 0,
    stock = null,
    batch = null,
    allowed_payment_modes,
    isBestseller = false,
    isSubscriptionAllowed = false,
    subs_weekly_plans = null,
    subs_monthly_plans = null,
    isWeeklyAllowed = true,
    isMonthlyAllowed = true,
  }) {
    const serialized = (
      Array.isArray(packaging_size) ? packaging_size : []
    ).map((p) => {
      if (typeof p === "string") return p;
      try {
        const s = JSON.stringify(p);
        if (s.length > 512) {
          throw new Error(
            "packaging_size item exceeds 512 chars (shrink data)"
          );
        }
        return s;
      } catch {
        return JSON.stringify({ size: "", price_cents: "", images: [] });
      }
    });

    // Sanitize + serialize batch array -> string or null
    const batchArray = Array.isArray(batch) ? batch : [];
    const sanitizedBatch = batchArray
      .map((b) => ({
        name: String(b?.name ?? "").trim(),
        delivery_date: String(b?.delivery_date ?? "").trim(),
      }))
      .filter((b) => b.name || b.delivery_date);
    const batchPayload = sanitizedBatch.length
      ? JSON.stringify(sanitizedBatch)
      : null;

    // Core payload — absolute baseline, confirmed safe in all schema versions
    const corePayload = {
      name,
      slug,
      description,
      sku,
      // Send null for empty relationship — never send "" (Appwrite rejects it)
      categories: categories || null,
      packaging_size: serialized,
      currency,
      discount,
    };

    // Extended payload — newer attributes; may not exist in all schemas
    const extendedPayload = {
      ...corePayload,
      ...(stock !== null && stock !== undefined ? { stock } : {}),
      ...(batchPayload !== null ? { batch: batchPayload } : {}),
      ...(Array.isArray(allowed_payment_modes) && allowed_payment_modes.length
        ? { allowed_payment_modes }
        : {}),
      isBestseller,
      isSubscriptionAllowed,
      subs_weekly_plans,
      subs_monthly_plans,
      isWeeklyAllowed,
      isMonthlyAllowed,
    };

    try {
      const res = await this.databases.createDocument(
        conf.appwriteDatabaseId,
        conf.appwriteProductsCollection,
        slug,
        extendedPayload
      );
      return this.normalizeProductDoc(res);
    } catch (err) {
      const isUnknownAttr =
        /unknown attribute|invalid attribute|Extra attribute/i.test(
          err?.message || ""
        );
      if (isUnknownAttr) {
        console.warn(
          "[createProduct] Retrying without extended attributes. " +
            "Add 'stock', 'batch', and 'allowed_payment_modes' to your Appwrite " +
            "products collection to enable these features. Raw error:",
          err.message
        );
        const res = await this.databases.createDocument(
          conf.appwriteDatabaseId,
          conf.appwriteProductsCollection,
          slug,
          corePayload
        );
        return this.normalizeProductDoc(res);
      }
      console.error("[createProduct] Appwrite error:", err?.message, err);
      throw err;
    }
  }

  async updateProduct(
    documentId,
    {
      name,
      slug,
      description,
      sku,
      categories = null,
      packaging_size = [],
      currency = "INR",
      discount = 0,
      stock = null,
      batch,
      allowed_payment_modes,
      isBestseller,
      isSubscriptionAllowed,
      subs_weekly_plans,
      subs_monthly_plans,
      isWeeklyAllowed,
      isMonthlyAllowed,
    }
  ) {
    const serialized = (
      Array.isArray(packaging_size) ? packaging_size : []
    ).map((p) => {
      if (typeof p === "string") return p;
      try {
        const s = JSON.stringify(p);
        if (s.length > 512) {
          throw new Error(
            "packaging_size item exceeds 512 chars (shrink data)"
          );
        }
        return s;
      } catch {
        return JSON.stringify({ size: "", price_cents: "", images: [] });
      }
    });

    // NEW: sanitize + serialize batch array -> string or null
    const batchArray = Array.isArray(batch) ? batch : [];
    const sanitizedBatch = batchArray
      .map((b) => ({
        name: String(b?.name ?? "").trim(),
        delivery_date: String(b?.delivery_date ?? "").trim(),
      }))
      .filter((b) => b.name || b.delivery_date);
    const batchPayload = sanitizedBatch.length
      ? JSON.stringify(sanitizedBatch)
      : null;

    // Core payload — absolute baseline, confirmed safe in all schema versions
    const corePayload = {
      name,
      slug,
      description,
      sku,
      // Send null for empty relationship — never send "" (Appwrite rejects it)
      categories: categories || null,
      packaging_size: serialized,
      currency,
      discount,
    };

    // Extended payload — includes newer attributes that may not exist in
    // all Appwrite schemas. We try these first and fall back if rejected.
    const extendedPayload = {
      ...corePayload,
      ...(stock !== null && stock !== undefined ? { stock } : {}),
      ...(batchPayload !== undefined ? { batch: batchPayload } : {}),
      ...(Array.isArray(allowed_payment_modes) && allowed_payment_modes.length
        ? { allowed_payment_modes }
        : {}),
      ...(typeof isBestseller === "boolean" ? { isBestseller } : {}),
      ...(typeof isSubscriptionAllowed === "boolean" ? { isSubscriptionAllowed } : {}),
      subs_weekly_plans,
      subs_monthly_plans,
      isWeeklyAllowed,
      isMonthlyAllowed,
    };

    try {
      const res = await this.databases.updateDocument(
        conf.appwriteDatabaseId,
        conf.appwriteProductsCollection,
        documentId,
        extendedPayload
      );
      return this.normalizeProductDoc(res);
    } catch (err) {
      // If Appwrite rejects because a newer attribute (batch / allowed_payment_modes)
      // hasn't been added to the collection schema yet, retry with core fields only.
      const isUnknownAttr =
        /unknown attribute|invalid attribute|Extra attribute/i.test(
          err?.message || ""
        );
      if (isUnknownAttr) {
        console.warn(
          "[updateProduct] Retrying without extended attributes. " +
          "Add 'stock', 'batch', and 'allowed_payment_modes' to your Appwrite products " +
          "collection to enable these features. Raw error:",
          err.message
        );
        const res = await this.databases.updateDocument(
          conf.appwriteDatabaseId,
          conf.appwriteProductsCollection,
          documentId,
          corePayload
        );
        return this.normalizeProductDoc(res);
      }
      // Log real error before re-throwing so it's visible in console
      console.error("[updateProduct] Appwrite error:", err?.message, err);
      throw err;
    }
  }

  // NEW: Update product stock (deduct or add)
  async updateProductStock(slug, quantityToDeduct) {
    try {
      const product = await this.databases.getDocument(
        conf.appwriteDatabaseId,
        conf.appwriteProductsCollection,
        slug
      );

      const currentStock = typeof product.stock === "number" ? product.stock : null;
      if (currentStock === null) return null; // Not tracking stock

      const newStock = Math.max(0, currentStock - quantityToDeduct);

      return await this.databases.updateDocument(
        conf.appwriteDatabaseId,
        conf.appwriteProductsCollection,
        slug,
        { stock: newStock }
      );
    } catch (error) {
      console.error("Appwrite :: updateProductStock error ::", error);
      throw error;
    }
  }

  async deleteProduct(slug) {
    try {
      const product = await this.databases.getDocument(
        conf.appwriteDatabaseId,
        conf.appwriteProductsCollection,
        slug
      );

      // Gather all image fileIds from nested packaging_size
      const allIds = [];
      if (Array.isArray(product.packaging_size)) {
        for (const entry of product.packaging_size) {
          let obj = entry;
          if (typeof obj === "string") {
            try {
              obj = JSON.parse(obj);
            } catch {
              throw new Error("Error Deleting Product");
            }
          }
          if (obj && Array.isArray(obj.images)) {
            obj.images.forEach((fid) => {
              if (typeof fid === "string" && fid.trim()) allIds.push(fid);
            });
          }
        }
      }

      // Delete each image (best effort)
      await Promise.allSettled(allIds.map((id) => this.deleteFile(id)));

      return await this.databases.deleteDocument(
        conf.appwriteDatabaseId,
        conf.appwriteProductsCollection,
        slug
      );
    } catch (error) {
      console.error("Appwrite :: deleteProduct error ::", error);
      throw error;
    }
  }

  async listProducts(queries = []) {
    try {
      const res = await this.databases.listDocuments(
        conf.appwriteDatabaseId,
        conf.appwriteProductsCollection,
        queries
      );

      const documents = res.documents.map((doc) =>
        this.normalizeProductDoc(doc)
      );

      return { ...res, documents };
    } catch (error) {
      console.error("Appwrite :: listProducts error ::", error);
      throw error;
    }
  }

  async createSubscription({
    user_id,
    product_id,
    packaging_size,
    quantity,
    interval,
    shippingAddress,
    payment_id = null,
    paymentMode = "Online",
    paymentStatus = "pending",
    total_cycles = 1,
    is_upfront_paid = false,
  }) {
    const now = new Date();
    const nextOrderAt = new Date(now);

    if (interval === "monthly")
      nextOrderAt.setMonth(nextOrderAt.getMonth() + 1);
    else nextOrderAt.setDate(nextOrderAt.getDate() + 7);

    const payload = {
      user_id,
      product_id,
      packaging_size,
      quantity,
      interval,
      status: "active",
      nextOrderAt: nextOrderAt.toISOString(),
      startedAt: now.toISOString(),
      shippingAddress,
      payment_id,
      paymentMode,
      paymentStatus,
      total_cycles,
      remaining_cycles: total_cycles,
      is_upfront_paid,
    };

    try {
      return await this.databases.createDocument(
        conf.appwriteDatabaseId,
        conf.appwriteSubscriptionCollection,
        ID.unique(),
        payload,
        [
          Permission.read(Role.user(user_id)),
          Permission.update(Role.user(user_id)),
          Permission.delete(Role.user(user_id)),
        ]
      );
    } catch (error) {
      console.error("Appwrite :: createSubscription error ::", error);
      throw error;
    }
  }

  /**
   * List subscriptions with optional filters.
   * Accepts: { user_id, product_id, packaging_size, interval, queries }
   * Returns array of subscription documents
   */
  async listSubscriptions({
    user_id,
    product_id,
    packaging_size,
    interval,
    queries = [],
  } = {}) {
    try {
      const q = Array.isArray(queries) ? [...queries] : [];
      if (user_id)
        q.push(Query.equal("user_id", user_id));
      if (product_id)
        q.push(Query.equal("product_id", product_id));
      if (packaging_size)
        q.push(Query.equal("packaging_size", packaging_size));
      if (interval)
        q.push(Query.equal("interval", interval));

      const res = await this.databases.listDocuments(
        conf.appwriteDatabaseId,
        conf.appwriteSubscriptionCollection,
        q
      );
      return res.documents || [];
    } catch (error) {
      console.error("Appwrite :: listSubscriptions error ::", error);
      throw error;
    }
  }

  async updateSubscription(subscriptionId, updates) {
    try {
      return await this.databases.updateDocument(
        conf.appwriteDatabaseId,
        conf.appwriteSubscriptionCollection,
        subscriptionId,
        updates
      );
    } catch (error) {
      console.error("Appwrite :: updateSubscription error ::", error);
      throw error;
    }
  }

  async deleteSubscription(subscriptionId) {
    try {
      return await this.databases.deleteDocument(
        conf.appwriteDatabaseId,
        conf.appwriteSubscriptionCollection,
        subscriptionId
      );
    } catch (error) {
      console.error("Appwrite :: deleteSubscription error ::", error);
      throw error;
    }
  }

  async updateProductDiscount(productId, discount) {
    try {
      const res = await this.databases.updateDocument(
        conf.appwriteDatabaseId,
        conf.appwriteProductsCollection,
        productId,
        { discount }
      );
      return appwriteConfigService.normalizeProductDoc(res);
    } catch (error) {
      console.error("Appwrite :: updateProductDiscount error ::", error);
      throw error;
    }
  }

  // 🟢 Update average rating and review count for a product
  async updateProductReviewStats(productId) {
    try {
      if (!productId) return null;
      // 1️⃣ Get all reviews for this product (indexed using productID string)
      const reviewsRes = await this.databases.listDocuments(
        conf.appwriteDatabaseId,
        conf.appwriteReviewCollection,
        [Query.equal("productID", productId)]
      );

      const reviews = reviewsRes.documents;
      const count = reviews.length;

      let avgRating = 0;
      if (count > 0) {
        const total = reviews.reduce(
          (sum, r) => sum + Number(r?.rating || 0),
          0
        );
        avgRating = parseFloat((total / count).toFixed(2));
      }

      // 2️⃣ Update product document with new stats
      const res = await this.databases.updateDocument(
        conf.appwriteDatabaseId,
        conf.appwriteProductsCollection,
        productId,
        {
          average_rating: avgRating,
          review_count: count,
        }
      );
      return appwriteConfigService.normalizeProductDoc(res);
    } catch (error) {
      console.error("Appwrite :: updateProductReviewStats error ::", error);
      throw error;
    }
  }

  async createCategory({ name, slug, imageId = null, navIcon = null }) {
    const corePayload = { name, slug };
    const extendedPayload = { ...corePayload, imageId, navIcon };
    try {
      return await this.databases.createDocument(
        conf.appwriteDatabaseId,
        conf.appwriteCategoriesCollection,
        slug,
        extendedPayload
      );
    } catch (error) {
      const isUnknownAttr = /unknown attribute|invalid attribute|Extra attribute/i.test(error?.message || "");
      if (isUnknownAttr) {
        // Try with imageId only (no navIcon)
        try {
          return await this.databases.createDocument(
            conf.appwriteDatabaseId,
            conf.appwriteCategoriesCollection,
            slug,
            { ...corePayload, imageId }
          );
        } catch (err2) {
          const isAttrErr2 = /unknown attribute|invalid attribute|Extra attribute/i.test(err2?.message || "");
          if (isAttrErr2) {
            console.warn("[createCategory] imageId/navIcon attribute missing. Falling back to core fields.");
            return await this.databases.createDocument(
              conf.appwriteDatabaseId,
              conf.appwriteCategoriesCollection,
              slug,
              corePayload
            );
          }
          throw err2;
        }
      }
      console.error("Appwrite :: createCategory error ::", error);
      throw error;
    }
  }

  async updateCategory(slug, { name, imageId, navIcon }) {
    const corePayload = { name };
    const extendedPayload = { ...corePayload, imageId: imageId ?? null, navIcon: navIcon ?? null };
    try {
      return await this.databases.updateDocument(
        conf.appwriteDatabaseId,
        conf.appwriteCategoriesCollection,
        slug,
        extendedPayload
      );
    } catch (error) {
      const isUnknownAttr = /unknown attribute|invalid attribute|Extra attribute/i.test(error?.message || "");
      if (isUnknownAttr) {
        // Try with imageId only (navIcon may not exist in schema yet)
        try {
          return await this.databases.updateDocument(
            conf.appwriteDatabaseId,
            conf.appwriteCategoriesCollection,
            slug,
            { ...corePayload, imageId: imageId ?? null }
          );
        } catch (err2) {
          const isAttrErr2 = /unknown attribute|invalid attribute|Extra attribute/i.test(err2?.message || "");
          if (isAttrErr2) {
            console.warn("[updateCategory] Falling back to name-only update.");
            return await this.databases.updateDocument(
              conf.appwriteDatabaseId,
              conf.appwriteCategoriesCollection,
              slug,
              corePayload
            );
          }
          throw err2;
        }
      }
      console.error("Appwrite :: updateCategory error ::", error);
      throw error;
    }
  }

  async deleteCategory(id) {
    try {
      // 1. Try to find the category to check for associated images (Best Effort)
      let imageId = null;
      try {
        const category = await this.databases.getDocument(
          conf.appwriteDatabaseId,
          conf.appwriteCategoriesCollection,
          id
        );
        imageId = category.imageId;
      } catch (err) {
        console.warn("Appwrite :: deleteCategory :: Could not fetch category for cleanup, proceeding with deletion anyway.");
      }

      // 2. Clean up associated image if found
      if (imageId) {
        try {
          await this.deleteFile(imageId);
        } catch (err) {
          console.warn("Appwrite :: deleteCategory :: Image cleanup failed but proceeding.");
        }
      }

      // 3. Delete the document
      return await this.databases.deleteDocument(
        conf.appwriteDatabaseId,
        conf.appwriteCategoriesCollection,
        id
      );
    } catch (error) {
      console.error("Appwrite :: deleteCategory error ::", error);
      throw error;
    }
  }

  async listCategories(queries = []) {
    try {
      return await this.databases.listDocuments(
        conf.appwriteDatabaseId,
        conf.appwriteCategoriesCollection,
        queries
      );
    } catch (error) {
      console.error("Appwrite :: listCategories error ::", error);
      throw error;
    }
  }

  async createOrder({
    user_id,
    userName,
    userEmail,
    userPhone,
    items,
    shippingAddress,
    total_cents,
    paymentStatus,
    fulfillmentStatus,
    delivery_date,
    paymentMode,
    payment_id,
    auto_order = false,
  }) {
    // Generate a unique ID to use for both the document ID and the orderNumber attribute
    const docId = ID.unique();

    // Name variations - Exhaustive list to catch all possible schema keys
    const nameVal = userName || "Customer";
    
    // Initial exhaustive payload with all common naming variations
    // The "Self-Healing" loop below will automatically strip any that don't exist in your DB.
    const payload = {
      // User ID variations
      userId: user_id,
      user_id: user_id,
      "User ID": user_id,
      "user id": user_id,
      "USER ID": user_id,
      userid: user_id,
      UserID: user_id,
      // Order Number variations
      orderNumber: docId,
      "Order Number": docId,
      "order number": docId,
      "ORDER NUMBER": docId,
      OrderNumber: docId,
      // Name variations
      "User Name": nameVal,
      "user name": nameVal,
      "USER NAME": nameVal,
      userName: nameVal,
      username: nameVal,
      user_name: nameVal,
      Username: nameVal,
      UserName: nameVal,
      USER_NAME: nameVal,
      name: nameVal,
      customerName: nameVal,
      customer_name: nameVal,
      // Email/Phone variations
      userEmail: userEmail || "",
      user_email: userEmail || "",
      email: userEmail || "",
      userPhone: userPhone || "",
      user_phone: userPhone || "",
      phone: userPhone || "",
      // Date variations
      delivery_date: delivery_date || "",
      deliveryDate: delivery_date || "",
      "delivery date": delivery_date || "",
      "Delivery Date": delivery_date || "",
      // Standard fields
      items,
      shippingAddress,
      total_cents,
      totalCents: total_cents,
      "Total Cents": total_cents,
      "total cents": total_cents,
      // Enum fields
      paymentMode: paymentMode === "ONLINE" ? "Card" : (paymentMode || "COD"),
      paymentStatus: (paymentStatus && String(paymentStatus).toLowerCase() === "paid") ? "Paid" : "Pending",
      fulfillmentStatus: fulfillmentStatus || "pending",
      fulfillmentSattus: (fulfillmentStatus || "pending").toLowerCase(),
      payment_id: payment_id || null,
      auto_order: !!auto_order,
    };

    let currentPayload = { ...payload };
    const maxRetries = 15;
    let attempt = 0;

    while (attempt < maxRetries) {
      try {
        return await this.databases.createDocument(
          conf.appwriteDatabaseId,
          conf.appwriteOrdersCollection,
          docId,
          currentPayload,
          [Permission.read(Role.user(user_id))]
        );
      } catch (error) {
        attempt++;
        const errorMessage = error?.message || "";
        
        // 1. Check for "Extra attribute" / "not found in collection"
        const extraAttrMatch = errorMessage.match(/attribute ["']?([^"']+)["']? (is not found|not found|is not allowed|extra)/i);
        
        if (extraAttrMatch) {
          const attrToRemove = extraAttrMatch[1];
          console.warn(`[createOrder] Attribute "${attrToRemove}" not in schema. Stripping and retrying...`);
          delete currentPayload[attrToRemove];
          continue; // Retry with stripped payload
        }

        // 2. If we reach here, it's a non-attribute error (like network or permissions)
        // or a "Missing attribute" error that we haven't satisfied yet.
        console.error(`Appwrite :: createOrder error (Attempt ${attempt}) ::`, error);
        throw error;
      }
    }
  }

  async updateOrder(orderNumber, updates) {
    try {
      return await this.databases.updateDocument(
        conf.appwriteDatabaseId,
        conf.appwriteOrdersCollection,
        orderNumber,
        updates
      );
    } catch (error) {
      console.error("Appwrite :: updateOrder error ::", error);
      throw error;
    }
  }

  async listOrders() {
    try {
      return await this.databases.listDocuments(
        conf.appwriteDatabaseId,
        conf.appwriteOrdersCollection
      );
    } catch (error) {
      console.error("Appwrite :: listOrders error ::", error);
      throw error;
    }
  }

  async getOrder(orderNumber) {
    try {
      return await this.databases.getDocument(
        conf.appwriteDatabaseId,
        conf.appwriteOrdersCollection,
        orderNumber
      );
    } catch (error) {
      console.error("Appwrite :: getOrder error ::", error);
      throw error;
    }
  }

  async createCart({ user_id, items = {} }) {
    try {
      const payload = {
        user_id,
        items: JSON.stringify(items), // auto stringify
      };

      return await this.databases.createDocument(
        conf.appwriteDatabaseId,
        conf.appwriteCartsCollection,
        user_id,
        payload,
        [
          Permission.read(Role.user(user_id)),
          Permission.update(Role.user(user_id)),
          Permission.delete(Role.user(user_id)),
        ]
      );
    } catch (error) {
      console.error("Appwrite :: createCart error ::", error);
      throw error;
    }
  }

  async updateCart(user_id, { items = {} }) {
    try {
      const payload = {
        user_id,
        items: JSON.stringify(items), // auto stringify
      };

      const updatedDoc = await this.databases.updateDocument(
        conf.appwriteDatabaseId,
        conf.appwriteCartsCollection,
        user_id,
        payload
      );

      // Return items parsed for frontend
      return { ...updatedDoc, items };
    } catch (error) {
      if (error.code === 404) {
        // Doc doesn't exist, create it
        return await this.createCart({ user_id, items });
      }
      console.error("Appwrite :: updateCart error ::", error);
      throw error;
    }
  }

  async getCart(user_id) {
    try {
      const res = await this.databases.listDocuments(
        conf.appwriteDatabaseId,
        conf.appwriteCartsCollection,
        [Query.equal("user_id", user_id)]
      );

      const doc = res.documents[0];
      if (!doc) {
        return { items: {} };
      }

      return {
        ...doc,
        items: doc.items ? JSON.parse(doc.items) : {}, // auto parse
      };
    } catch (error) {
      console.error("Appwrite :: getCart error ::", error);
      throw error;
    }
  }

  async emptyCart(user_id) {
    try {
      const updatedDoc = await this.databases.updateDocument(
        conf.appwriteDatabaseId,
        conf.appwriteCartsCollection,
        user_id,
        { items: JSON.stringify({}) }
      );

      return { ...updatedDoc, items: {} }; // return empty object
    } catch (error) {
      if (error.code === 404) {
        return { items: {} };
      }
      console.error("Appwrite :: emptyCart error ::", error);
      throw error;
    }
  }

  async deleteCart(user_id) {
    try {
      return await this.databases.deleteDocument(
        conf.appwriteDatabaseId,
        conf.appwriteCartsCollection,
        user_id
      );
    } catch (error) {
      console.error("Appwrite :: deleteCart error ::", error);
      throw error;
    }
  }

  async uploadFile(file) {
    try {
      return await this.storage.createFile(
        conf.appwriteBucketId,
        ID.unique(),
        file
      );
    } catch (error) {
      console.error("Appwrite :: uploadFile error ::", error);
      // Re-throw so callers receive the real Appwrite error message
      throw error;
    }
  }

  async deleteFile(fileId) {
    try {
      await this.storage.deleteFile(conf.appwriteBucketId, fileId);
      return true;
    } catch (error) {
      if (error?.code !== 404) {
        console.error("Appwrite :: deleteFile error ::", error);
      }
      return false;
    }
  }

  getfileView(fileId) {
    return this.storage.getFileView(conf.appwriteBucketId, fileId);
  }

  getfilePreview(fileId) {
    return this.storage.getFilePreview(conf.appwriteBucketId, fileId);
  }

  async createUserProfile({ user_id, displayName, phone, address, email }) {
    try {
      if (address === null || address === undefined) {
        throw new Error("Address is required to create user profile");
      }
      return await this.databases.createDocument(
        conf.appwriteDatabaseId,
        conf.appwriteUsersCollection,
        user_id,
        {
          user_id,
          displayName,
          phone,
          address,
          email,
        },
        [
          Permission.read(Role.user(user_id)),
          Permission.update(Role.user(user_id)),
          Permission.delete(Role.user(user_id)),
        ]
      );
    } catch (error) {
      console.error("Appwrite :: createUserProfile error ::", error);
      throw error;
    }
  }

  async deleteUserProfile(user_id) {
    try {
      return await this.databases.deleteDocument(
        conf.appwriteDatabaseId,
        conf.appwriteUsersCollection,
        user_id
      );
    } catch (error) {
      console.error("Appwrite :: deleteUserProfile error ::", error);
      throw error;
    }
  }

  async updateUserProfile({ user_id, displayName, phone, address, email }) {
    try {
      return await this.databases.updateDocument(
        conf.appwriteDatabaseId,
        conf.appwriteUsersCollection,
        user_id,
        {
          user_id,
          displayName,
          phone,
          address,
          email,
        }
      );
    } catch (error) {
      console.error("Appwrite :: updateUserProfile error ::", error);
      throw error;
    }
  }

  async listUserProfiles(queries = []) {
    try {
      return await this.databases.listDocuments(
        conf.appwriteDatabaseId,
        conf.appwriteUsersCollection,
        queries
      );
    } catch (error) {
      console.error("Appwrite :: listUserProfiles error ::", error);
      throw error;
    }
  }

  async getUserProfile(userId) {
    if (!userId) return null;
    try {
      // Use listDocuments with a query for robustness
      const res = await this.databases.listDocuments(
        conf.appwriteDatabaseId,
        conf.appwriteUsersCollection,
        [Query.equal("user_id", userId)]
      );
      
      // Return the first matching document
      return res.documents[0] || null;
    } catch (error) {
      console.error("Appwrite :: getUserProfile error ::", error);
      throw error;
    }
  }

  // ---- Ads ----
  async createAd({ title, description }) {
    try {
      return await this.databases.createDocument(
        conf.appwriteDatabaseId,
        conf.appwriteAdsCollection,
        ID.unique(),
        { title, description }
      );
    } catch (error) {
      console.error("Appwrite :: createAd error ::", error);
      throw error;
    }
  }

  async updateAd(adId, { title, description }) {
    try {
      return await this.databases.updateDocument(
        conf.appwriteDatabaseId,
        conf.appwriteAdsCollection,
        adId,
        { title, description }
      );
    } catch (error) {
      console.error("Appwrite :: updateAd error ::", error);
      throw error;
    }
  }

  async deleteAd(adId) {
    try {
      return await this.databases.deleteDocument(
        conf.appwriteDatabaseId,
        conf.appwriteAdsCollection,
        adId
      );
    } catch (error) {
      console.error("Appwrite :: deleteAd error ::", error);
      throw error;
    }
  }

  async listAds(queries = []) {
    try {
      return await this.databases.listDocuments(
        conf.appwriteDatabaseId,
        conf.appwriteAdsCollection,
        queries
      );
    } catch (error) {
      console.error("Appwrite :: listAds error ::", error);
      throw error;
    }
  }

  // ---- Active Ad ----
  async getActiveAd() {
    try {
      // Always assume a single doc in this collection
      const res = await this.databases.listDocuments(
        conf.appwriteDatabaseId,
        conf.appwriteActiveAdsCollection
      );
      return res.documents[0] ?? null;
    } catch (error) {
      console.error("Appwrite :: getActiveAd error ::", error);
      throw error;
    }
  }

  async setActiveAd(adId) {
    try {
      const activeDoc = await this.getActiveAd();

      if (activeDoc) {
        // Update the existing doc
        return await this.databases.updateDocument(
          conf.appwriteDatabaseId,
          conf.appwriteActiveAdsCollection,
          activeDoc.$id,
          { activeAdId: adId }
        );
      } else {
        // Create first-time active doc
        return await this.databases.createDocument(
          conf.appwriteDatabaseId,
          conf.appwriteActiveAdsCollection,
          ID.unique(),
          { activeAdId: adId }
        );
      }
    } catch (error) {
      console.error("Appwrite :: setActiveAd error ::", error);
      throw error;
    }
  }

  // In appwriteConfigService.js
  async clearActiveAd() {
    try {
      const activeRes = await this.getActiveAd();
      if (activeRes) {
        await this.databases.deleteDocument(
          conf.appwriteDatabaseId,
          conf.appwriteActiveAdsCollection,
          activeRes.$id
        );
      }
    } catch (error) {
      console.error("Appwrite :: clearActiveAd error ::", error);
      throw error;
    }
  }

  //Products Reviews
  async createReview({ product_id, user_id, rating }) {
    const docId = `${user_id}_${product_id}`; // composite key ensures uniqueness
    const payload = { product_id, user_id, rating, productID: product_id };
    const permissions = [
      Permission.read(Role.any()),
      Permission.update(Role.user(user_id)),
    ];

    try {
      // Try to create; if doc exists, handle 409 and update instead
      return await this.databases.createDocument(
        conf.appwriteDatabaseId,
        conf.appwriteReviewCollection,
        docId,
        payload,
        permissions
      );
    } catch (error) {
      // Duplicate document -> update the rating
      if (error?.code === 409 || error?.response?.code === 409) {
        return await this.updateReview(docId, { rating });
      }
      console.error("Appwrite :: createReview error ::", error);
      throw error;
    }
  }

  async updateReview(review_id, { rating }) {
    try {
      return await this.databases.updateDocument(
        conf.appwriteDatabaseId,
        conf.appwriteReviewCollection,
        review_id,
        { rating }
      );
    } catch (error) {
      console.error("Appwrite :: updateReview error ::", error);
      throw error;
    }
  }

  async listReview(productId) {
    try {
      return await this.databases.listDocuments(
        conf.appwriteDatabaseId,
        conf.appwriteReviewCollection,
        [Query.equal("productID", productId)]
      );
    } catch (error) {
      console.error("Appwrite :: listReview error ::", error);
      throw error;
    }
  }

  // 🔎 Get a single user's review for a product (by composite id)
  async getUserReview(product_id, user_id) {
    const docId = `${user_id}_${product_id}`;
    try {
      return await this.databases.getDocument(
        conf.appwriteDatabaseId,
        conf.appwriteReviewCollection,
        docId
      );
    } catch (error) {
      if (error?.code === 404) return null;
      console.error("Appwrite :: getUserReview error ::", error);
      throw error;
    }
  }

  // ⭐ One-call helper: upsert review and refresh product stats
  async rateProduct({ product_id, user_id, rating }) {
    try {
      await this.createReview({ product_id, user_id, rating });
      return await this.updateProductReviewStats(product_id);
    } catch (error) {
      console.error("Appwrite :: rateProduct error ::", error);
      throw error;
    }
  }
}

const appwriteService = new appwriteConfigService();

export default appwriteService;
