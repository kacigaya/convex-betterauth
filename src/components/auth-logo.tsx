import Image from "next/image";

export function AuthLogo() {
  return (
    <div className="flex justify-center">
      <Image
        src="/convex.ico"
        alt="Convex"
        width={98}
        height={100}
        loading="eager"
      />
      <Image
        src="/betterauth-black.png"
        alt="Better Auth"
        width={101}
        height={100}
        className="dark:hidden"
        loading="eager"
      />
      <Image
        src="/betterauth-white.png"
        alt="Better Auth"
        width={101}
        height={100}
        className="hidden dark:block"
        loading="eager"
      />
    </div>
  );
}
