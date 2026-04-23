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
        return userAccount;
      } else {
        return userAccount;
      }
    } catch (error) {
      throw new Error("Appwrite Error :: Create Account :: " + error.message) ;
    }
  }

  async login({ email, password }) {
    try {
      return await this.account.createEmailPasswordSession(email, password);
    } catch (error) {
      throw new Error("Appwrite Error :: Login :: " + error.message);
    }
  }

  async deleteAccount() {
    try {
      await this.account.delete();
    } catch (error) {
      throw new Error("Appwrite Error :: Delete Account :: " + error.message);
    }
  }

  async logout() {
    try {
      await this.account.deleteSession("current");
    } catch (error) {
      throw new Error ("Appwrite Error :: Logout :: " + error.message);
    }
  }

  async getUser() {
    try {
      return await this.account.get();
    } catch {
      return null;
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

  async createTeamMembership({ roles, userId }) {
    try {
      return await this.teams.createMembership(
        conf.appwriteTeamsId,
        roles,
        userId
      );
    } catch (error) {
      return "Appwrite Error :: Create Team Membership :: " + error.message;
    }
  }

  async listTeamMemberships() {
    try {
      return await this.teams.listMemberships(conf.appwriteTeamsId);
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
    try {
      // 1. Get current user
      const user = await this.getUser();
      if (!user) {
        console.warn("[isAdmin] No active session found.");
        return false;
      }

      // 2. Validate Configuration
      if (!conf.appwriteTeamsId || conf.appwriteTeamsId === "undefined") {
        console.error("[isAdmin] CRITICAL: VITE_APPWRITE_TEAMS_ID is not configured in environment variables.");
        // Fallback: If we're in a dev environment and the user is the owner, maybe allow? 
        // But we don't have an easy way to check 'owner' via Client SDK.
        return false;
      }

      // 3. Check Team Memberships
      const memberships = await this.teams.listMemberships(conf.appwriteTeamsId);
      
      // Smooth Login: Allow if the user is part of the team
      const membership = memberships.memberships.find(m => m.userId === user.$id);
      
      if (membership) {
        console.log(`[isAdmin] Authorized via Team: User ${user.email} is in team ${conf.appwriteTeamsId}`);
        return true;
      }

      // 4. Super Admin Fallback (to solve "Not Authorized" issues for the primary account)
      const superAdmins = ["truesoilorganic@gmail.com", "turesoilorganic@gmail.com"];
      if (superAdmins.includes(user.email.toLowerCase())) {
        console.warn(`[isAdmin] Authorized via Super Admin Fallback: ${user.email}`);
        return true;
      }

      console.warn(`[isAdmin] Unauthorized: User ${user.email} not found in team ${conf.appwriteTeamsId}`);
      return false;
    } catch (error) {
      console.error("[isAdmin] Error checking admin status:", error.message);
      return false;
    }
  }

  async createPasswordRecovery(email) {
    try {
      return await this.account.createRecovery(
        email,
        `${window.location.origin}/reset-password`
      );
    } catch (error) {
      throw new Error("Appwrite Error :: Create Recovery :: " + error.message);
    }
  }

  async updatePasswordRecovery(userId, secret, password, passwordAgain) {
    try {
      return await this.account.updateRecovery(
        userId,
        secret,
        password,
        passwordAgain
      );
    } catch (error) {
      throw new Error("Appwrite Error :: Update Recovery :: " + error.message);
    }
  }
}
const appwriteAuthService = new AuthService();
export default appwriteAuthService;
