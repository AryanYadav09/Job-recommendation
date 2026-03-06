/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        ink: "#0d1321",
        mist: "#f7f9fc",
        accent: "#0ea5e9",
        accent2: "#22c55e",
        slateglass: "rgba(11, 18, 32, 0.62)"
      },
      boxShadow: {
        glow: "0 10px 40px rgba(14, 165, 233, 0.35)"
      },
      backgroundImage: {
        "mesh-light": "radial-gradient(circle at 15% 20%, rgba(14,165,233,0.15), transparent 35%), radial-gradient(circle at 80% 0%, rgba(34,197,94,0.16), transparent 25%), linear-gradient(120deg, #f8fafc 0%, #eef2ff 40%, #f5f9ff 100%)",
        "mesh-dark": "radial-gradient(circle at 10% 15%, rgba(14,165,233,0.25), transparent 35%), radial-gradient(circle at 78% 8%, rgba(34,197,94,0.2), transparent 28%), linear-gradient(120deg, #020617 0%, #0f172a 52%, #0a192f 100%)"
      },
      fontFamily: {
        display: ["Poppins", "sans-serif"],
        body: ["Manrope", "sans-serif"]
      }
    }
  },
  plugins: []
};
