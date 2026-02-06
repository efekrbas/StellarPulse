import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                stellar: {
                    primary: "#3E1BDB",
                    secondary: "#7B61FF",
                    accent: "#00D4FF",
                    dark: "#0D0D1A",
                    card: "#1A1A2E",
                    border: "#2A2A4A",
                },
            },
            backgroundImage: {
                "gradient-stellar": "linear-gradient(135deg, #3E1BDB 0%, #7B61FF 50%, #00D4FF 100%)",
                "gradient-dark": "linear-gradient(180deg, #0D0D1A 0%, #1A1A2E 100%)",
            },
            boxShadow: {
                stellar: "0 0 30px rgba(123, 97, 255, 0.3)",
                glow: "0 0 60px rgba(0, 212, 255, 0.2)",
            },
        },
    },
    plugins: [],
};

export default config;
