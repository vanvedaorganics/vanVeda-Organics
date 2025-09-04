import conf from "../conf/conf.js";
import { Client, Account, ID, Teams } from "appwrite";

export class AuthService {
  client = new Client();
  account;
  teams;

  constructor() {
    this.client
      .setEndpoint(conf.appwriteUrl)
      .setProject(conf.appwriteProjectId);
    this.teams = new Teams(this.client);
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
        return "User Created Successfully";
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

  async updateName({ name }) {
    try {
      return await this.account.updateName(name);
    } catch (error) {
      return "Appwrite Error :: Update Name :: " + error.message;
    }
  }

  async createTeamMembership({ roles, email, userId }) {
    try {
      return await this.teams.createMembership({
        teamId: conf.appwriteTeamsId,
        roles: [roles],
        email: email,
        userId: userId,
      });
    } catch (error) {
      return "Appwrite Error :: Create Team Membership :: " + error.message;
    }
  }

  async listTeamMemberships() {
    try {
      return await this.teams.listMemberships({ teamId: conf.appwriteTeamsId });
    } catch (error) {
      return "Appwrite Error :: List Team Memberships :: " + error.message;
    }
  }

  async updateTeamMembership(membershipId, roles) {
    try {
      return await this.teams.updateMembership({
        teamId: conf.appwriteTeamsId,
        membershipId: membershipId,
        roles: [roles],
      });
    } catch (error) {
      return "Appwrite Error :: Update Team Membership :: " + error.message;
    }
  }

  async deleteTeamMembership(membershipId) {
    try {
      return await this.teams.deleteMembership({
        teamId: conf.appwriteTeamsId,
        membershipId: membershipId,
      });
    } catch (error) {
      return "Appwrite Error :: Delete Team Membership :: " + error.message;
    }
  }

  async isAdmin() {
    try{
      const user = await this.getUser();
      const memberships = await this.teams.listMemberships(conf.appwriteTeamsId);
      return memberships.memberships.some(
        (m) => m.userId === user.$id && m.confirm
      );
    }catch (error){
      console.log("Appwrite Error :: isAdmin :: " + error.message);
      return false;
    }

  }

}
const appwriteAuthService = new AuthService();
export default appwriteAuthService;
