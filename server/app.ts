/* eslint-disable @typescript-eslint/no-unused-vars */
import AuthenticatingConcept from "./concepts/authenticating";
import FriendingConcept from "./concepts/friending";
import PostingConcept from "./concepts/posting";
import SessioningConcept from "./concepts/sessioning";
import Logging from "./concepts/logging";

// The app is a composition of concepts instantiated here
// and synchronized together in `routes.ts`.
export const Sessioning = new SessioningConcept();
export const Authing = new AuthenticatingConcept("users");
export const Posting = new PostingConcept("sisterCirclePosts", "careBoardPosts", "circles");
export const Friending = new FriendingConcept("friends");
export { default as Logging } from "./concepts/logging";
