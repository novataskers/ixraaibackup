import fs from 'fs';

const sidebarPath = 'src/components/Sidebar.tsx';
let sidebar = fs.readFileSync(sidebarPath, 'utf8');

// The mobile header bar logo
sidebar = sidebar.replace(
  /<div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center shadow-\[0_0_16px_rgba\(245,158,11,0\.5\)\]">\s*<Sparkles className="w-4 h-4 text-white" \/>\s*<\/div>/g,
  '<img src="/logo.png" alt="IxraAI Logo" className="w-8 h-8 object-contain drop-shadow-[0_0_12px_rgba(245,158,11,0.5)]" />'
);

// The desktop sidebar logo
sidebar = sidebar.replace(
  /<div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center shrink-0 shadow-\[0_0_20px_rgba\(245,158,11,0\.45\)\]">\s*<Sparkles className="w-5 h-5 text-white" \/>\s*<\/div>/g,
  '<img src="/logo.png" alt="IxraAI Logo" className="w-9 h-9 object-contain shrink-0 drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]" />'
);

fs.writeFileSync(sidebarPath, sidebar);
console.log("Sidebar updated to use logo.png");
