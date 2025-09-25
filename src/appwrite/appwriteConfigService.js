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
        return parsedDoc;
      });

      return { ...res, documents };
    } catch (error) {
      console.log("Appwrite :: listProducts error ::", error);
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
    userId,
    items,
    shippingAddress,
    totalCents,
    paymentStatus,
    fulfillmentStatus,
    paymentMode,
  }) {
    try {
      return await this.databases.createDocument(
        conf.appwriteDatabaseId,
        conf.appwriteOrdersCollection,
        ID.unique(),
        {
          orderNumber: ID.unique(),
          userId,
          items,
          shippingAddress,
          totalCents,
          paymentStatus,
          fulfillmentStatus,
          paymentMode,
        }
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

  async listOrders(queries = []) {
    try {
      return await this.databases.listDocuments(
        conf.appwriteDatabaseId,
        conf.appwriteOrdersCollection,
        queries
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
}

const appwriteService = new appwriteConfigService();

export default appwriteService;
