/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        ink: "#081121",
        mist: "#f7fbff",
        accent: "#2563eb",
        accent2: "#60a5fa",
        slateglass: "rgba(7, 17, 33, 0.72)"
      },
      boxShadow: {
        glow: "0 22px 70px rgba(37, 99, 235, 0.28)",
        card: "0 20px 60px rgba(15, 23, 42, 0.08)",
        lifted: "0 28px 80px rgba(15, 23, 42, 0.16)"
      },
      backgroundImage: {
        "mesh-light": "radial-gradient(circle at 12% 18%, rgba(147,197,253,0.28), transparent 30%), radial-gradient(circle at 86% 10%, rgba(96,165,250,0.2), transparent 24%), linear-gradient(180deg, #ffffff 0%, #f8fbff 42%, #f1f7ff 100%)",
        "mesh-dark": "radial-gradient(circle at 10% 18%, rgba(59,130,246,0.3), transparent 30%), radial-gradient(circle at 82% 12%, rgba(125,211,252,0.18), transparent 24%), linear-gradient(180deg, #020617 0%, #071226 44%, #0b1730 100%)"
      },
      fontFamily: {
        display: ["Space Grotesk", "sans-serif"],
        body: ["Manrope", "sans-serif"]
      }
    }
  },
  plugins: []
};
