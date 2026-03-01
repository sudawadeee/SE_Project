import React, { useState, useEffect, useRef } from 'react';

// --- การตั้งค่า: แยก URL ของแต่ละ Service ---
const CLASSIFICATION_URL = 'http://127.0.0.1:5000'; // บริการตรวจโรค (ของคุณ)
const CHATBOT_URL = 'http://127.0.0.1:5001';       // บริการแชตบอท (ของเพื่อน)

export default function App() {
  // สถานะสำหรับระบบตรวจโรค
  const [file, setFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState({ label: "", confidence: 0, insight: "" });

  // สถานะสำหรับระบบแชตบอท
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState([
    { role: 'bot', text: "สวัสดีครับ ผมคือ Dr. AI Assistant ยินดีที่ได้ช่วยเหลือครับ คุณสามารถสอบถามข้อมูลเกี่ยวกับสุขภาพผิวหนังได้ที่นี่เลย" }
  ]);
  const chatEndRef = useRef(null);

  // เลื่อนหน้าจอแชตลงล่างสุดอัตโนมัติ
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ฟังก์ชันอัปโหลดรูปภาพ
  const handleFileUpload = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setImagePreview(URL.createObjectURL(selectedFile));
      setShowResult(false);
    }
  };

  // ฟังก์ชันส่งรูปไปวิเคราะห์ (พอร์ต 5000)
  const handleAnalyze = async () => {
    if (!file) return alert("กรุณาอัปโหลดรูปภาพก่อนทำการวิเคราะห์ครับ");
    setIsAnalyzing(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${CLASSIFICATION_URL}/api/predict`, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (data.label) {
        setResult({
          label: data.label,
          confidence: data.confidence,
          insight: `จากการวิเคราะห์เบื้องต้นพบความเป็นไปได้ว่าเป็น ${data.label} คุณสามารถพิมพ์ถามวิธีการดูแลตัวเองได้จากช่องทางแชตด้านขวามือครับ`
        });
        setShowResult(true);
        // ส่งข้อความแจ้งเตือนในแชตอัตโนมัติ
        setMessages(prev => [...prev, { role: 'bot', text: `ผลวิเคราะห์ออกมาแล้วครับ: ${data.label} (ความแม่นยำ ${data.confidence}%) มีคำถามเพิ่มเติมเกี่ยวกับอาการนี้ไหมครับ?` }]);
      }
    } catch (error) {
      alert("ไม่สามารถติดต่อบริการวิเคราะห์โรคได้ (พอร์ต 5000) กรุณาตรวจสอบการรันเซิร์ฟเวอร์");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // ฟังก์ชันส่งข้อความแชต (พอร์ต 5001)
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = { role: 'user', text: chatInput };
    setMessages(prev => [...prev, userMsg]);
    const currentInput = chatInput;
    setChatInput("");

    try {
      const response = await fetch(`${CHATBOT_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: currentInput }),
      });
      const data = await response.json();
      setMessages(prev => [...prev, { role: 'bot', text: data.reply || data.response }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'bot', text: "ขออภัยครับ บริการแชตบอท (พอร์ต 5001) ขัดข้องชั่วคราว" }]);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      {/* ส่วนหัวของเว็บ */}
      <header className="bg-white shadow-sm py-4 px-8 border-b flex items-center gap-3 sticky top-0 z-20">
        <div className="bg-[#117b6f] p-2 rounded-lg text-white font-bold">AI</div>
        <h1 className="text-xl font-black text-slate-800 tracking-tight uppercase">AI Skin Assistant</h1>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {/* --- ส่วนซ้าย: ระบบวิเคราะห์รูปภาพ --- */}
        <section className="flex-1 p-8 overflow-y-auto bg-[#f8fafc]">
          <div className="max-w-4xl mx-auto">
            {!showResult ? (
              <div className="space-y-6 animate-in fade-in duration-700">
                <div className="bg-white border-2 border-dashed border-slate-300 rounded-3xl p-16 flex flex-col items-center justify-center transition-all hover:border-[#117b6f] hover:bg-teal-50/20 group">
                  {imagePreview ? (
                    <img src={imagePreview} className="max-h-80 rounded-2xl shadow-xl mb-6 border-4 border-white" alt="ตัวอย่างรูปภาพ" />
                  ) : (
                    <div className="text-teal-600 mb-6 bg-teal-50 p-6 rounded-full group-hover:scale-110 transition-transform">
                      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                    </div>
                  )}
                  <h3 className="text-xl font-bold text-slate-700 mb-1">อัปโหลดรูปภาพบริเวณผิวหนัง</h3>
                  <p className="text-slate-400 text-sm mb-6">รองรับไฟล์รูปแบบ JPG, PNG</p>
                  <input type="file" className="hidden" id="file-upload" onChange={handleFileUpload} />
                  <label htmlFor="file-upload" className="px-8 py-3 bg-white border border-slate-200 rounded-full cursor-pointer hover:shadow-md transition-all font-bold text-slate-600">
                    {file ? "เปลี่ยนรูปภาพ" : "เลือกรูปภาพจากเครื่อง"}
                  </label>
                </div>
                <button 
                  onClick={handleAnalyze} 
                  disabled={isAnalyzing || !file}
                  className={`w-full py-5 rounded-2xl font-black text-white text-xl shadow-lg transition-all ${isAnalyzing || !file ? 'bg-slate-300' : 'bg-[#117b6f] hover:bg-[#0c5c53] shadow-teal-200 hover:-translate-y-1'}`}
                >
                  {isAnalyzing ? "🔬 กำลังวิเคราะห์..." : "เริ่มการวินิจฉัย"}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-bottom-4 duration-500">
                {/* ฝั่งซ้าย: แสดงรูปที่ตรวจ */}
                <div className="space-y-4">
                  <div className="bg-white p-3 rounded-3xl shadow-xl border border-slate-100">
                    <img src={imagePreview} className="w-full h-[450px] object-cover rounded-2xl shadow-inner" alt="ผลการตรวจ" />
                  </div>
                </div>
                {/* ฝั่งขวา: รายละเอียดผลลัพธ์ */}
                <div className="bg-white rounded-3xl p-8 shadow-xl border-t-8 border-[#117b6f] flex flex-col">
                  <div className="flex-1">
                    <span className="bg-teal-100 text-[#117b6f] text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">ผลการตรวจโดย AI</span>
                    <h3 className="text-4xl font-black text-slate-800 mt-4 mb-2">{result.label}</h3>
                    
                    <div className="my-8">
                      <div className="flex justify-between items-end mb-2">
                        <span className="text-slate-400 text-xs font-bold uppercase">ระดับความมั่นใจ</span>
                        <span className="text-2xl font-black text-[#117b6f]">{result.confidence}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden border border-slate-50">
                        <div className="bg-gradient-to-r from-[#117b6f] to-teal-400 h-full transition-all duration-1000" style={{ width: `${result.confidence}%` }}></div>
                      </div>
                    </div>

                    <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 italic text-slate-600 text-sm leading-relaxed">
                      " {result.insight} "
                    </div>
                  </div>
                  <button onClick={() => setShowResult(false)} className="mt-8 w-full py-4 border-2 border-slate-200 text-slate-500 font-bold rounded-2xl hover:bg-slate-50 transition-all">
                    ทำการประเมินใหม่
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* --- ส่วนขวา: ระบบแชตบอท (RAG) --- */}
        <aside className="w-[450px] bg-white border-l border-slate-200 flex flex-col shadow-2xl z-10">
          <div className="p-6 border-b bg-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center text-xl">🤖</div>
              <div>
                <h3 className="font-black text-slate-800 text-sm">Dr. AI Assistant</h3>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">เชื่อมต่อกับพอร์ต 5001 เรียบร้อย</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-slate-50/30">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-[#117b6f] text-white rounded-tr-none font-medium' : 'bg-white border border-slate-100 text-slate-700 rounded-tl-none font-medium'}`}>
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="p-6 border-t bg-white">
            <div className="relative flex items-center">
              <input 
                type="text" 
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="สอบถามข้อมูลสุขภาพผิว..." 
                className="w-full bg-slate-100 border-none rounded-2xl py-4 px-6 pr-14 text-sm focus:ring-2 focus:ring-[#117b6f] transition-all" 
              />
              <button type="submit" className="absolute right-2 bg-[#117b6f] text-white p-2.5 rounded-xl hover:bg-[#0c5c53] shadow-lg transition-transform active:scale-90">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
              </button>
            </div>
          </form>
        </aside>
      </main>
    </div>
  );
}