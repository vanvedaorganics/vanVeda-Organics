import conf from "../conf/conf.js";
import { Client, Account, Databases, Storage, Query, ID } from "appwrite";

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
    price_cents,
    image_file_ids,
    stock,
    sku,
    categories,
  }) {
    try {
      return await this.databases.createDocument(
        conf.appwriteDatabaseId,
        conf.appwriteProductsCollection,
        slug,
        {
          name,
          description,
          price_cents,
          image_file_ids,
          stock,
          sku,
          categories,
        }
      );
    } catch (error) {
      console.log("Appwrite :: createProduct error ::", error);
      throw error;
    }
  }

  async updateProduct(
    slug,
    { name, description, price_cents, image_file_ids, stock, sku, categories }
  ) {
    try {
      return await this.databases.updateDocument(
        conf.appwriteDatabaseId,
        conf.appwriteProductsCollection,
        slug,
        {
          name,
          description,
          price_cents,
          image_file_ids,
          stock,
          sku,
          categories,
        }
      );
    } catch (error) {
      console.log("Appwrite :: updateProduct error ::", error);
      throw error;
    }
  }

  async deleteProduct(slug) {
    try {
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
      return await this.databases.listDocuments(
        conf.appwriteDatabaseId,
        conf.appwriteProductsCollection,
        queries
      );
    } catch (error) {
      console.log("Appwrite :: listProducts error ::", error);
      throw error;
    }
  }

  async createCategory({ name, slug, parentId = null }) {
    try {
      return await this.databases.createDocument(
        conf.appwriteDatabaseId,
        conf.appwriteCategoriesCollection,
        slug,
        {
          name,
          parentId,
        }
      );
    } catch (error) {
      console.log("Appwrite :: createCategory error ::", error);
      throw error;
    }
  }

  async updateCategory(slug, { name, parentId = null }) {
    try {
      return await this.databases.updateDocument(
        conf.appwriteDatabaseId,
        conf.appwriteCategoriesCollection,
        slug,
        {
          name,
          parentId,
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

  async createCart({ userId, items = {} }) {
    try {
      return await this.databases.createDocument(
        conf.appwriteDatabaseId,
        conf.appwriteCartsCollection,
        userId,
        {
          items,
        }
      );
    } catch (error) {
      console.log("Appwrite :: createCart error ::", error);
      throw error;
    }
  }

  async updateCart(userId, { items = {} }) {
    try {
      return await this.databases.updateDocument(
        conf.appwriteDatabaseId,
        conf.appwriteCartsCollection,
        userId,
        {
          items,
        }
      );
    } catch (error) {
      console.log("Appwrite :: updateCart error ::", error);
      throw error;
    }
  }

  async getCart(userId) {
    try {
      return await this.databases.getDocument(
        conf.appwriteDatabaseId,
        conf.appwriteCartsCollection,
        userId
      );
    } catch (error) {
      console.log("Appwrite :: getCart error ::", error);
      throw error;
    }
  }

  async emptyCart(userId) {
    try {
      return await this.databases.updateDocument(
        conf.appwriteDatabaseId,
        conf.appwriteCartsCollection,
        userId,
        {
          items: {},
        }
      );
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

  getfilePreview(fileId) {
    return this.storage.getFilePreview(conf.appwriteBucketId, fileId);
  }

  async createUserProfile({ userId, name, phone, address, email }) {
    try {
      if (address === null || address === undefined) {
        throw new Error("Address is required to create user profile");
      }
      return await this.databases.createDocument(
        conf.appwriteDatabaseId,
        conf.appwriteUsersCollection,
        userId,
        {
          name,
          phone,
          address,
          email,
        }
      );
    } catch (error) {
      console.log("Appwrite :: createUserProfile error ::", error);
      throw error;
    }
  }

  async updateUserProfile(userId, { name, phone, address, email }) {
    try {
      return await this.databases.updateDocument(
        conf.appwriteDatabaseId,
        conf.appwriteUsersCollection,
        userId,
        {
          name,
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
}

const appwriteService = new appwriteConfigService();

export default appwriteService;
