// tailwind.config.js
module.exports = {
    content: ["./*.{html,js}"],
    theme: {
      extend: {},
    },
    plugins: [require("daisyui")],
    daisyui: {
      themes: ["cupcake"], // เลือกธีมที่ต้องการ
    },
  }
  