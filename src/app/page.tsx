import { api } from "../../convex/_generated/api";
import { preloadAuthQuery } from "@/lib/auth-server";
import { HomeContent } from "./home-content";

export default async function Home() {
  const preloadedUser = await preloadAuthQuery(api.auth.getCurrentUser);

  return <HomeContent preloadedUser={preloadedUser} />;
}
