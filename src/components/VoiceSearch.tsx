// "use client";

// import React, { useState, useEffect } from 'react';
// import { Mic, MicOff } from 'lucide-react';

// interface VoiceSearchProps {
//   onSearch: (text: string) => void;
// }

// export default function VoiceSearch({ onSearch }: VoiceSearchProps) {
//   const [isListening, setIsListening] = useState(false);
//   const [recognition, setRecognition] = useState<any>(null);
//   const [isSupported, setIsSupported] = useState(true);

//   useEffect(() => {
//     // Pastikan kode ini hanya dieksekusi di browser, bukan di server
//     if (typeof window !== 'undefined') {
//       // Deteksi dukungan browser untuk Web Speech API
//       const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

//       if (SpeechRecognition) {
//         const recog = new SpeechRecognition();
//         recog.continuous = false;
//         recog.interimResults = false;
//         recog.lang = 'id-ID'; // Menggunakan Bahasa Indonesia

//         recog.onresult = (event: any) => {
//           const transcript = event.results[0][0].transcript;
//           onSearch(transcript);
//           setIsListening(false);
//         };

//         recog.onerror = (event: any) => {
//           console.error("Voice recognition error:", event.error);
//           setIsListening(false);
//         };

//         recog.onend = () => {
//           setIsListening(false);
//         };

//         setRecognition(recog);
//       } else {
//         setIsSupported(false);
//       }
//     }
//   }, [onSearch]);

//   const toggleListening = () => {
//     if (!isSupported || !recognition) {
//       alert("Maaf, browser Anda tidak mendukung fitur pencarian suara. Gunakan Google Chrome.");
//       return;
//     }

//     if (isListening) {
//       recognition.stop();
//       setIsListening(false);
//     } else {
//       recognition.start();
//       setIsListening(true);
//     }
//   };

//   if (!isSupported) {
//     return null; // Sembunyikan tombol jika browser tidak mendukung
//   }

//   return (
//     <button
//       onClick={toggleListening}
//       type="button"
//       title="Cari dengan suara"
//       className={`p-2.5 rounded-full transition-all duration-300 shadow-sm flex items-center justify-center ${isListening
//         ? 'bg-red-50 text-red-500 animate-pulse ring-2 ring-red-200'
//         : 'bg-white text-slate-500 hover:bg-orange-50 hover:text-[#D2691E] border border-slate-200'
//         }`}
//     >
//       {isListening ? <MicOff size={18} /> : <Mic size={18} />}
//     </button>
//   );
// }