import { ObjectId } from "mongodb";

import { Router, getExpressRouter } from "./framework/router";

import { Authing, Friending, Logging, Posting, Sessioning } from "./app";
import { SessionDoc } from "./concepts/sessioning";
import Responses from "./responses";
import { Mood, Symptom, FlowIntensity } from "./concepts/logging";

import { z } from "zod";
import session from "express-session";

/**
 * Web server routes for the app. Implements synchronizations between concepts.
 */
class Routes {
  // Synchronize the concepts from `app.ts`.

  @Router.get("/session")
  async getSessionUser(session: SessionDoc) {
    const user = Sessioning.getUser(session);
    return await Authing.getUserById(user);
  }

  @Router.get("/users")
  async getUsers() {
    return await Authing.getUsers();
  }

  @Router.get("/users/:username")
  @Router.validate(z.object({ username: z.string().min(1) }))
  async getUser(username: string) {
    return await Authing.getUserByUsername(username);
  }

  @Router.post("/users")
  async createUser(session: SessionDoc, username: string, password: string) {
    Sessioning.isLoggedOut(session);
    return await Authing.create(username, password);
  }

  @Router.patch("/users/username")
  async updateUsername(session: SessionDoc, username: string) {
    const user = Sessioning.getUser(session);
    return await Authing.updateUsername(user, username);
  }

  @Router.patch("/users/password")
  async updatePassword(session: SessionDoc, currentPassword: string, newPassword: string) {
    const user = Sessioning.getUser(session);
    return Authing.updatePassword(user, currentPassword, newPassword);
  }

  @Router.delete("/users")
  async deleteUser(session: SessionDoc) {
    const user = Sessioning.getUser(session);
    Sessioning.end(session);
    return await Authing.delete(user);
  }

  @Router.post("/login")
  async logIn(session: SessionDoc, username: string, password: string) {
    const u = await Authing.authenticate(username, password);
    Sessioning.start(session, u._id);
    return { msg: "Logged in!" };
  }

  @Router.post("/logout")
  async logOut(session: SessionDoc) {
    Sessioning.end(session);
    return { msg: "Logged out!" };
  }

  @Router.get("/sistercircle/posts")
  async getSisterCirclePosts(author?: string, circle?: string) {
    let posts;

    if (author) {
      const id = (await Authing.getUserByUsername(author))._id;
      posts = await Posting.getSisterCirclePostsByAuthor(id);
    } else {
      posts = await Posting.getAllSisterCirclePosts();
    }

    if (circle && circle !== "All Circles") {
      const circlePosts = await Posting.getSisterCirclePostsByCircle(circle);
      const circlePostIds = new Set(circlePosts.map((post) => post._id.toString()));
      posts = posts.filter((post) => circlePostIds.has(post._id.toString()));
    }
    const postsReturned = await Responses.posts(posts);
    return postsReturned;
  }

  @Router.get("/sistercircle/posts/byTitle")
  async getSisterCirclePostsByTitle(title?: string) {
    let posts;
    if (title) {
      posts = await Posting.getSisterCirclePostsByTitle(title);
    } else {
      posts = await Posting.getAllSisterCirclePosts();
    }
    return Responses.posts(posts);
  }

  @Router.post("/sistercircle/posts")
  async createSisterCirclePost(session: SessionDoc, title: string, content: string, anonymous: boolean, circles: string[]) {
    const userID = Sessioning.getUser(session);
    const user = await Authing.getUserById(userID);
    const created = await Posting.createSisterCirclePost(anonymous ? null : userID, anonymous ? null : user.username, title, content, anonymous, circles);
    return { msg: created.msg, post: await Responses.post(created.post) };
  }

  @Router.delete("/sistercircle/posts/:id")
  async deleteSisterCirclePost(session: SessionDoc, id: string) {
    const user = Sessioning.getUser(session);
    const oid = new ObjectId(id);
    await Posting.assertAuthorIsUser(oid, user, "SisterCircle");
    return Posting.deleteSisterCirclePost(oid);
  }

  @Router.get("/mycareboard/posts")
  async getMyCareBoardPosts(author: string) {
    const posts = await Posting.getMyCareBoardPostsByDestinationUsername(author);
    return Responses.posts(posts);
  }

  @Router.post("/mycareboard/posts")
  async createMyCareBoardPost(session: SessionDoc, title: string, content: string, postedOnUsername: string) {
    const userID = Sessioning.getUser(session);
    const user = await Authing.getUserById(userID);
    const created = await Posting.createMyCareBoardPost(userID, user.username, title, content, postedOnUsername);
    return { msg: created.msg, post: await Responses.post(created.post) };
  }

  @Router.delete("/mycareboard/posts/:id")
  async deleteMyCareBoardPost(session: SessionDoc, id: string) {
    const user = Sessioning.getUser(session);
    const oid = new ObjectId(id);
    await Posting.assertAuthorIsUser(oid, user, "MyCareBoard");
    return Posting.deleteMyCareBoardPost(oid);
  }

  @Router.get("/circles")
  async getCircles(username?: string) {
    if (username) {
      const id = (await Authing.getUserByUsername(username))._id;
      return { circles: await Authing.getUserCircles(id) };
    }
    const circles = await Posting.getAllCircles();
    return { circles: await Responses.circles(circles) };
  }

  @Router.get("/circles/:username")
  async getUserCircles(username: string) {
    const id = (await Authing.getUserByUsername(username))._id;
    return { circles: await Authing.getUserCircles(id) };
  }

  @Router.post("/circles")
  async addCircles(session: SessionDoc, circles: string[]) {
    const user = Sessioning.getUser(session);
    return await Authing.addUserToCircle(user, circles);
  }

  @Router.get("/friends")
  async getFriends(session: SessionDoc) {
    const user = Sessioning.getUser(session);
    return await Authing.idsToUsernames(await Friending.getFriends(user));
  }

  @Router.delete("/friends/:friend")
  async removeFriend(session: SessionDoc, friend: string) {
    const user = Sessioning.getUser(session);
    const friendOid = (await Authing.getUserByUsername(friend))._id;
    return await Friending.removeFriend(user, friendOid);
  }

  @Router.get("/friend/requests")
  async getRequests(session: SessionDoc) {
    const user = Sessioning.getUser(session);
    return await Responses.friendRequests(await Friending.getRequests(user));
  }

  @Router.post("/friend/requests/:to")
  async sendFriendRequest(session: SessionDoc, to: string) {
    const user = Sessioning.getUser(session);
    const toOid = (await Authing.getUserByUsername(to))._id;
    return await Friending.sendRequest(user, toOid);
  }

  @Router.delete("/friend/requests/:to")
  async removeFriendRequest(session: SessionDoc, to: string) {
    const user = Sessioning.getUser(session);
    const toOid = (await Authing.getUserByUsername(to))._id;
    return await Friending.removeRequest(user, toOid);
  }

  @Router.put("/friend/accept/:from")
  async acceptFriendRequest(session: SessionDoc, from: string) {
    const user = Sessioning.getUser(session);
    const fromOid = (await Authing.getUserByUsername(from))._id;
    return await Friending.acceptRequest(fromOid, user);
  }

  @Router.put("/friend/reject/:from")
  async rejectFriendRequest(session: SessionDoc, from: string) {
    const user = Sessioning.getUser(session);
    const fromOid = (await Authing.getUserByUsername(from))._id;
    return await Friending.rejectRequest(fromOid, user);
  }

  @Router.get("/cycles/stats")
  async getCycleStats(session: SessionDoc) {
    const user = Sessioning.getUser(session);
    const stats = await Logging.getInstance().calculateCycleStats(user);
    return { msg: "Successfully retrieved cycle statistics!", stats };
  }

  @Router.post("/logs")
  async createLog(session: SessionDoc, dateOfLog: Date, symptoms: Symptom[], mood: Mood | null, flow: FlowIntensity | null, notes: string) {
    const user = Sessioning.getUser(session);
    return await Logging.getInstance().create(user, dateOfLog, symptoms, mood, flow, notes);
  }

  @Router.put("/logs/:id")
  async updateLog(session: SessionDoc, id: string, symptoms: Symptom[], mood: Mood | null, flow: FlowIntensity | null, notes: string) {
    const user = Sessioning.getUser(session);
    const oid = new ObjectId(id);
    await Logging.getInstance().assertAuthorIsUser(oid, user);
    return await Logging.getInstance().update(oid, symptoms, mood, flow, notes);
  }

  @Router.get("/log")
  async getLog(session: SessionDoc, date: Date) {
    const user = Sessioning.getUser(session);
    return await Logging.getInstance().getLogByDate(user, date);
  }

  @Router.get("/circles")
  @Router.validate(z.object({ user: z.string().optional() }))
  async getPosts(user: string) {
    const id = (await Authing.getUserByUsername(user))._id;
    return await Authing.getUserCircles(id);
  }

   // debugging routes
  // @Router.get("/logs")
  // async getLogs() {
  //   return await Logging.getInstance().getLogs();
  // }

  // @Router.delete("/logs")
  // async deleteLogs() {
  //   return await Logging.getInstance().deleteAllLogs();
  // }
}

/** The web app. */
export const app = new Routes();

/** The Express router. */
export const appRouter = getExpressRouter(app);
