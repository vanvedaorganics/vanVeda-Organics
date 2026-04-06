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
  Functions,
} from "appwrite";

export class appwriteConfigService {
  client = new Client();
  account;
  databases;
  storage;
  functions;

  constructor() {
    this.client
      .setEndpoint(conf.appwriteUrl)
      .setProject(conf.appwriteProjectId);
    this.databases = new Databases(this.client);
    this.storage = new Storage(this.client);
    this.functions = new Functions(this.client);

    // this.account = new Account(this.client);
  }

  async createProduct({
    slug,
    name,
    description,
    sku,
    categories = "",
    packaging_size = [], // may be objects or already strings
    currency = "INR",
    discount = 0,
    batch = null,
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

    return await this.databases.createDocument(
      conf.appwriteDatabaseId,
      conf.appwriteProductsCollection,
      slug,
      {
        name,
        slug,
        description,
        sku,
        categories,
        packaging_size: serialized,
        currency,
        discount,
        batch: batchPayload, // NEW
      }
    );
  }

  async updateProduct(
    slug,
    {
      name,
      description,
      sku,
      categories = "",
      packaging_size = [],
      currency = "INR",
      discount = 0,
      batch,
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

    return await this.databases.updateDocument(
      conf.appwriteDatabaseId,
      conf.appwriteProductsCollection,
      slug,
      {
        name,
        description,
        sku,
        categories,
        packaging_size: serialized,
        currency,
        discount,
        batch: batchPayload, // NEW
      }
    );
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
      console.log("Appwrite :: deleteProduct error ::", error);
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

      const documents = res.documents.map((doc) => {
        const parsedDoc = { ...doc };
        if (Array.isArray(parsedDoc.packaging_size)) {
          parsedDoc.packaging_size = parsedDoc.packaging_size.map((item) => {
            if (typeof item === "string") {
              try {
                const obj = JSON.parse(item);
                return {
                  size: obj?.size || "",
                  price_cents: obj?.price_cents || "",
                  images: Array.isArray(obj?.images)
                    ? obj.images.filter(
                        (id) => typeof id === "string" && id.trim()
                      )
                    : [],
                };
              } catch {
                return { size: "", price_cents: "", images: [] };
              }
            }
            // already object
            return {
              size: item?.size || "",
              price_cents: item?.price_cents || "",
              images: Array.isArray(item?.images)
                ? item.images.filter(
                    (id) => typeof id === "string" && id.trim()
                  )
                : [],
            };
          });
        } else {
          parsedDoc.packaging_size = [];
        }

        // NEW: parse batch string -> array for UI
        if (typeof parsedDoc.batch === "string" && parsedDoc.batch.trim()) {
          try {
            const arr = JSON.parse(parsedDoc.batch);
            parsedDoc.batch = Array.isArray(arr)
              ? arr
                  .map((b) => ({
                    name: String(b?.name ?? "").trim(),
                    delivery_date: String(b?.delivery_date ?? "").trim(),
                  }))
                  .filter((b) => b.name || b.delivery_date)
              : [];
          } catch {
            parsedDoc.batch = [];
          }
        } else if (!Array.isArray(parsedDoc.batch)) {
          parsedDoc.batch = [];
        }

        return parsedDoc;
      });

      return { ...res, documents };
    } catch (error) {
      console.log("Appwrite :: listProducts error ::", error);
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
      console.log("Appwrite :: createSubscription error ::", error);
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
      if (typeof user_id !== "undefined")
        q.push(Query.equal("user_id", user_id));
      if (typeof product_id !== "undefined")
        q.push(Query.equal("product_id", product_id));
      if (typeof packaging_size !== "undefined")
        q.push(Query.equal("packaging_size", packaging_size));
      if (typeof interval !== "undefined")
        q.push(Query.equal("interval", interval));

      const res = await this.databases.listDocuments(
        conf.appwriteDatabaseId,
        conf.appwriteSubscriptionCollection,
        q
      );
      return res.documents || [];
    } catch (error) {
      console.log("Appwrite :: listSubscriptions error ::", error);
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
      console.log("Appwrite :: updateSubscription error ::", error);
      throw error;
    }
  }

  async updateProductDiscount(productId, discount) {
    try {
      return await this.databases.updateDocument(
        conf.appwriteDatabaseId,
        conf.appwriteProductsCollection,
        productId,
        { discount }
      );
    } catch (error) {
      console.log("Appwrite :: updateProductDiscount error ::", error);
      throw error;
    }
  }

  // 🟢 Update average rating and review count for a product
  async updateProductReviewStats(productId) {
    try {
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
      return await this.databases.updateDocument(
        conf.appwriteDatabaseId,
        conf.appwriteProductsCollection,
        productId,
        {
          average_rating: avgRating,
          review_count: count,
        }
      );
    } catch (error) {
      console.error("Appwrite :: updateProductReviewStats error ::", error);
      throw error;
    }
  }

  async createCategory({ name, slug }) {
    try {
      return await this.databases.createDocument(
        conf.appwriteDatabaseId,
        conf.appwriteCategoriesCollection,
        slug,
        {
          name,
          slug,
        }
      );
    } catch (error) {
      console.log("Appwrite :: createCategory error ::", error);
      throw error;
    }
  }

  async updateCategory(slug, { name }) {
    try {
      return await this.databases.updateDocument(
        conf.appwriteDatabaseId,
        conf.appwriteCategoriesCollection,
        slug,
        {
          name,
        }
      );
    } catch (error) {
      console.log("Appwrite :: updateCategory error ::", error);
      throw error;
    }
  }

  async deleteCategory(slug) {
    try {
      return await this.databases.deleteDocument(
        conf.appwriteDatabaseId,
        conf.appwriteCategoriesCollection,
        slug
      );
    } catch (error) {
      console.log("Appwrite :: deleteCategory error ::", error);
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
      console.log("Appwrite :: listCategories error ::", error);
      throw error;
    }
  }

  async createOrder({
    user_id,
    userName,
    items,
    shippingAddress,
    total_cents,
    paymentStatus,
    fulfillmentStatus,
    delivery_date,
    paymentMode,
    auto_order = false,
  }) {
    try {
      // Build payload without undefined fields to respect backend defaults
      const payload = {
        user_id,
        userName,
        items,
        shippingAddress,
        total_cents,
        auto_order,
      };
      if (typeof delivery_date !== "undefined")
        payload.delivery_date = delivery_date;
      if (typeof paymentMode !== "undefined") payload.paymentMode = paymentMode;
      if (typeof paymentStatus !== "undefined")
        payload.paymentStatus = paymentStatus;
      if (typeof fulfillmentStatus !== "undefined")
        payload.fulfillmentStatus = fulfillmentStatus;

      return await this.databases.createDocument(
        conf.appwriteDatabaseId,
        conf.appwriteOrdersCollection,
        ID.unique(),
        payload,
        [Permission.read(Role.user(user_id))]
      );
    } catch (error) {
      console.log("Appwrite :: createOrder error ::", error);
      throw error;
    }
  }

  async updateOrder(orderNumber, { paymentStatus, fulfillmentStatus }) {
    try {
      return await this.databases.updateDocument(
        conf.appwriteDatabaseId,
        conf.appwriteOrdersCollection,
        orderNumber,
        {
          paymentStatus,
          fulfillmentStatus,
        }
      );
    } catch (error) {
      console.log("Appwrite :: updateOrder error ::", error);
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
      console.log("Appwrite :: listOrders error ::", error);
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
      console.log("Appwrite :: getOrder error ::", error);
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
      console.log("Appwrite :: createCart error ::", error);
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
      console.log("Appwrite :: updateCart error ::", error);
      throw error;
    }
  }

  async getCart(user_id) {
    try {
      const doc = await this.databases.getDocument(
        conf.appwriteDatabaseId,
        conf.appwriteCartsCollection,
        user_id
      );

      return {
        ...doc,
        items: doc.items ? JSON.parse(doc.items) : {}, // auto parse
      };
    } catch (error) {
      console.log("Appwrite :: getCart error ::", error);
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
      console.log("Appwrite :: emptyCart error ::", error);
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
      console.log("Appwrite :: uploadFile error ::", error);
      return false;
    }
  }

  async deleteFile(fileId) {
    try {
      await this.storage.deleteFile(conf.appwriteBucketId, fileId);
      return true;
    } catch (error) {
      console.log("Appwrite :: deleteFile error ::", error);
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
      console.log("Appwrite :: createUserProfile error ::", error);
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
      console.log("Appwrite :: updateUserProfile error ::", error);
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
      console.log("Appwrite :: listUserProfiles error ::", error);
      throw error;
    }
  }

  async getUserProfile(userId) {
    try {
      return await this.databases.getDocument(
        conf.appwriteDatabaseId,
        conf.appwriteUsersCollection,
        userId
      );
    } catch (error) {
      console.log("Appwrite :: getUserProfile error ::", error);
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
      console.log("Appwrite :: createAd error ::", error);
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
      console.log("Appwrite :: updateAd error ::", error);
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
      console.log("Appwrite :: deleteAd error ::", error);
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
      console.log("Appwrite :: listAds error ::", error);
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
      console.log("Appwrite :: getActiveAd error ::", error);
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
      console.log("Appwrite :: setActiveAd error ::", error);
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
      console.log("Appwrite :: clearActiveAd error ::", error);
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
      console.log("Appwrite :: updateReview error ::", error);
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
      console.log("Appwrite :: listReview error ::", error);
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
      console.log("Appwrite :: getUserReview error ::", error);
      throw error;
    }
  }

  // ⭐ One-call helper: upsert review and refresh product stats
  async rateProduct({ product_id, user_id, rating }) {
    try {
      await this.createReview({ product_id, user_id, rating });
      return await this.updateProductReviewStats(product_id);
    } catch (error) {
      console.log("Appwrite :: rateProduct error ::", error);
      throw error;
    }
  }

  // 💳 Razorpay
  async createRazorpayOrderId(amount) {
    try {
      if (!conf.appwriteRazorpayOrderIdFunctionId || conf.appwriteRazorpayOrderIdFunctionId === "undefined") {
        throw new Error("Razorpay Function ID not configured");
      }
      const res = await this.functions.createExecution(
        conf.appwriteRazorpayOrderIdFunctionId,
        JSON.stringify({ amount }),
        false,
        '/',
        'POST'
      );
      const parsedRes = JSON.parse(res.responseBody);
      if (!parsedRes.success) {
        throw new Error(parsedRes.message || "Failed to create Razorpay Order ID");
      }
      return parsedRes.order_id;
    } catch (error) {
      console.log("Appwrite :: createRazorpayOrderId error ::", error);
      throw error;
    }
  }
}

const appwriteService = new appwriteConfigService();

export default appwriteService;
