import conf from "../conf/conf.js";
import { Client, Account, Databases, Storage, Query } from "appwrite";

export class productConfigService {
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
}

const appwriteProductConfigService = new productConfigService();

export default appwriteProductConfigService;
