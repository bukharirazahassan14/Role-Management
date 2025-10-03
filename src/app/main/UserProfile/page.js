import UserProfile from "@/app/components/UserProfile";

export default async function UserProfilePage({ searchParams }) {
  // ⚡ await to resolve (needed in Next.js 15+)
  const resolved = await searchParams;

  // pass them straight through
  return <UserProfile searchParams={resolved} />;
}
