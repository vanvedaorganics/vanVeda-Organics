import conf from "../conf/conf.js";
import { Client, Account, ID } from "appwrite";

export class AuthService {
  client = new Client();
  account;

  constructor() {
    this.client
      .setEndpoint(conf.appwriteUrl)
      .setProject(conf.appwriteProjectId);
    this.account = new Account(this.client);
  }

  async createAccount({ email, password, name }) {
    try {
      const userAccount = await this.account.create(
        ID.unique(),
        email,
        password,
        name
      );
      if (userAccount) {
        //Call Login Function
        console.log("User Created Successfully");
        return "user created";
      } else {
        console.log("An Error Occurred While Creating User");
        return userAccount;
      }
    } catch (error) {
      return "Appwrite Error :: Create Account :: " + error.message;
    }
  }

  async login({ email, password }) {
    try {
      await this.account.createEmailPasswordSession(email, password);
    } catch (error) {
      return "Appwrite Error :: Login :: " + error.message;
    }
  }

  async logout() {
    try {
      await this.account.deleteSession("current");
    } catch (error) {
      return "Appwrite Error :: Logout :: " + error.message;
    }
  }

  async getUser() {
    try {
      return await this.account.get();
    } catch (error) {
      return "Appwrite Error :: Get User :: " + error.message;
    }
  }

  async updateEmail({ email, password }) {
    try {
      return await this.account.updateEmail(email, password);
    } catch (error) {
      return "Appwrite Error :: Update Email :: " + error.message;
    }
  }

  async updateName({ name }){
    try {
      return await this.account.updateName(name);
    } catch (error) {
      return "Appwrite Error :: Update Name :: " + error.message;
    }
  }
}
const appwriteAuthService = new AuthService();
export default appwriteAuthService;
