import nextPlugin from 'eslint-config-next'

// FIX (Alto #10 / calidad de CI): `npm run lint` existía en package.json
// pero no había ningún archivo de configuración de ESLint en el repo — el
// comando fallaba siempre con "ESLint couldn't find an eslint.config.js
// file". Esto significa que el linting nunca se ejecutó en este proyecto.
// `eslint-config-next` 16.x ya exporta un flat config nativo (sin necesidad
// de FlatCompat/eslintrc legacy), con las reglas recomendadas de Next.js:
// React Hooks, accesibilidad básica (jsx-a11y) y core-web-vitals.
const eslintConfig = [
  ...nextPlugin,
  {
    ignores: ['.next/**', 'node_modules/**', 'dist/**'],
  },
  {
    // `eslint-config-next` 16.x trae reglas de `eslint-plugin-react-hooks`
    // orientadas a preparar el código para el React Compiler
    // (`react-hooks/set-state-in-effect`, `react-hooks/purity`). Son
    // valiosas, pero marcan como error patrones extremadamente comunes y
    // hoy seguros (ej. `useEffect(() => setMounted(true), [])` para evitar
    // mismatches de hidratación) que aparecen tanto en código propio como
    // en los componentes vendorizados de shadcn/ui (`components/ui/*`).
    // Se bajan a "warn" para que el pipeline de CI no bloquee el proyecto
    // por patrones legítimos sin React Compiler habilitado, sin perder la
    // visibilidad de la regla. Adoptar React Compiler y resolver estos
    // warnings de raíz queda como mejora de seguimiento documentada.
    rules: {
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/purity': 'warn',
    },
  },
]

export default eslintConfig
