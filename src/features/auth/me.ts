import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../../lib/api/client";

export type MeUser = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
};

export type MeResponse = {
  user: MeUser;
};

async function fetchMe() {
  return apiFetch<MeResponse>("/api/mobile/me");
}

export function useMe() {
  return useQuery({
    queryKey: ["mobile-me"],
    queryFn: fetchMe,
  });
}