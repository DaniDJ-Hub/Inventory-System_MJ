/** @type {import('next').NextConfig} */
const nextConfig = {
  // FIX (Alto #11): antes `ignoreBuildErrors: true` permitía que el build de
  // producción pasara incluso con errores de TypeScript, anulando la principal
  // ventaja de usar un lenguaje tipado. Ahora el build falla si hay errores de
  // tipos, igual que cualquier proyecto TypeScript "production-grade".
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
