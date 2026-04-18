import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

const remotePatterns =
  supabaseUrl && supabaseUrl.startsWith("http")
    ? (() => {
        const parsedUrl = new URL(supabaseUrl);

        return [
          {
            protocol: parsedUrl.protocol.replace(":", "") as "http" | "https",
            hostname: parsedUrl.hostname,
            pathname: "/storage/v1/object/public/**",
          },
        ];
      })()
    : [];

const nextConfig: NextConfig = {
  images: {
    remotePatterns,
  },
};

export default nextConfig;
