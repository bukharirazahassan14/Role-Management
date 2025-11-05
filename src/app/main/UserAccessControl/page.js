import UserAccessControl from "@/app/components/UserAccessControl";

export default async function UserAccessControlPage({ searchParams }) {
  const resolved = await searchParams;
  // pass them straight through
  return <UserAccessControl searchParams={resolved} />;
}
