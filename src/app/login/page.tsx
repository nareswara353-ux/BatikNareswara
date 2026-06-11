import { SignIn } from '@clerk/nextjs';

export default function LoginPortal() {
  return (
    <div className="min-h-screen bg-[#FDFBF9] flex flex-col items-center justify-center p-4">

      {/* 👑 Branding Header Premium Batik Nareswara */}
      <div className="text-center mb-6">
        <h1 className="font-['Playfair_Display'] text-4xl font-bold text-slate-900 tracking-tight mb-2">
          Batik Nareswara
        </h1>
        <p className="text-sm font-['Playfair_Display'] text-slate-500 italic tracking-wide">
          Administrative Portal
        </p>
      </div>

      {/* 🔐 Komponen Utama Clerk yang Sudah Di-tuning Warna Cokelat Bata Premium */}
      <SignIn
        routing="hash" // 🔥 1. UBAH INI JADI HASH
        // path="/login" // 🔥 2. HAPUS ATAU JADIKAN KOMENTAR BARIS INI
        appearance={{
          elements: {
            // Mengubah shadow & bentuk card biar match sama UI lama lu
            card: 'shadow-2xl border border-slate-100 rounded-2xl bg-white max-w-md w-full',
            // Memaksa tombol utama Clerk pakai warna brand Batik Nareswara (#D2691E)
            formButtonPrimary: 'bg-[#D2691E] hover:bg-[#b85c1a] transition-all text-white font-bold py-2.5 rounded-lg text-sm normal-case shadow-md',
            // Menyelaraskan font internal Clerk
            headerTitle: 'font-["Playfair_Display"] text-slate-900 font-bold',
            headerSubtitle: 'text-slate-500 text-xs',
            footerActionLink: 'text-[#D2691E] hover:text-[#b85c1a] font-semibold',
            inputBorder: 'focus:border-[#D2691E] focus:ring-[#D2691E]',
          }
        }}
      />

      {/* 🛡️ Footer Kaki Portal */}
      <div className="mt-8 text-center">
        <p className="text-xs text-slate-400 font-sans tracking-wider">
          Protected by Zero-Bypass Clerk Enterprise Authentication
        </p>
      </div>

    </div>
  );
}