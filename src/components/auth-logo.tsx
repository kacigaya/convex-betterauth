import Image from "next/image";

export function AuthLogo() {
  return (
    <div className="flex justify-center">
      <Image src="/convex.ico" alt="Convex" width={100} height={100} />
      <Image
        src="/betterauth-black.png"
        alt="Better Auth"
        width={100}
        height={100}
        className="dark:hidden"
      />
      <Image
        src="/betterauth-white.png"
        alt="Better Auth"
        width={100}
        height={100}
        className="hidden dark:block"
      />
    </div>
  );
}
