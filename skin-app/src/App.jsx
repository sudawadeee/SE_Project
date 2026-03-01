import React, { useState } from 'react';

export default function App() {
  const [file, setFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showResult, setShowResult] = useState(false);
  
  // State สำหรับเก็บผลลัพธ์จริงจาก AI
  const [result, setResult] = useState({
    label: "",
    confidence: 0,
    insight: "",
    status: "Analysis Complete"
  });

  const handleFileUpload = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setImagePreview(URL.createObjectURL(selectedFile));
      setShowResult(false);
    }
  };

  const handleAnalyze = async () => {
    if (!file) return alert("Please upload a photo first!");
    
    setIsAnalyzing(true);

    // 1. เตรียมข้อมูลรูปภาพเพื่อส่งไปที่ API
    const formData = new FormData();
    formData.append('file', file); 

    try {
      // 2. ส่ง request ไปยัง Backend (Flask ที่รันอยู่ที่พอร์ต 5000)
      const response = await fetch('http://127.0.0.1:5000/api/predict', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error("Backend connection failed");

      const data = await response.json();

      // 3. นำข้อมูลจริงจาก AI มาอัปเดต State
      setResult({
        label: data.label,
        confidence: data.confidence,
        insight: `The AI analysis suggests this condition is ${data.label}. Please consult a dermatologist for a definitive diagnosis.`,
        status: "Self-care Sufficient"
      });

      setShowResult(true);
    } catch (error) {
      console.error("Error:", error);
      alert("Cannot connect to AI Server. Please ensure 'python app.py' is running!");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <header className="bg-white shadow-sm py-4 px-6 flex justify-between items-center border-b border-gray-200">
        <h1 className="text-xl font-bold text-slate-800">AI Skin Assistant</h1>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {/* ด้านซ้าย: พื้นที่ทำงานหลัก */}
        <section className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-3xl mx-auto">
            
            <div className="mb-6 flex items-center gap-2 text-slate-800 font-bold text-lg cursor-pointer" onClick={() => setShowResult(false)}>
              <span className="text-slate-500">&lt;</span>
              <h2>{showResult ? "Result" : "New Assessment"}</h2>
            </div>

            {!showResult ? (
              /* --- ส่วนที่ 1: หน้าอัปโหลดรูป --- */
              <>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-16 flex flex-col items-center justify-center bg-white mb-6">
                  {imagePreview ? (
                    <img src={imagePreview} className="max-h-64 rounded-lg mb-4 shadow-md" alt="Preview" />
                  ) : (
                    <div className="text-teal-600 mb-4 bg-green-50 p-4 rounded-full">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                    </div>
                  )}
                  <p className="text-slate-700 font-medium mb-1">Click to upload or drag & drop</p>
                  <p className="text-slate-400 text-sm">Supported formats: JPG, PNG</p>
                  <input type="file" className="hidden" id="file-upload" onChange={handleFileUpload} />
                  <label htmlFor="file-upload" className="mt-6 px-6 py-2 border border-slate-300 rounded-md cursor-pointer hover:bg-slate-50 text-sm font-medium text-slate-700">
                    {file ? "Change Photo" : "Browse Files"}
                  </label>
                </div>

                <button 
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || !file}
                  className={`w-full py-4 rounded-md font-bold text-white transition shadow-sm ${isAnalyzing || !file ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#117b6f] hover:bg-[#0e635a]'}`}
                >
                  {isAnalyzing ? "Analyzing... Please wait" : "Analyze Condition"}
                </button>
              </>
            ) : (
              /* --- ส่วนที่ 2: หน้าแสดงผลลัพธ์ (เชื่อมข้อมูลจริง) --- */
              <div className="space-y-6">
                <div className="rounded-xl overflow-hidden shadow-lg">
                  <img src={imagePreview} className="w-full h-64 object-cover" alt="Result" />
                </div>

                <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm relative">
                    <div className="absolute top-4 right-4 bg-green-50 text-green-600 text-xs font-bold px-3 py-1 rounded-full border border-green-200">
                      ✓ {result.status}
                    </div>
                    
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Analysis Result</p>
                    <h3 className="text-2xl font-bold text-slate-800 mb-6">{result.label}</h3>

                    <div className="mb-8">
                      <div className="flex justify-between text-sm font-bold mb-2">
                        <span className="text-slate-600">AI Confidence</span>
                        <span className="text-teal-600">{result.confidence}%</span>
                      </div>
                      <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-[#117b6f] h-full rounded-full transition-all duration-1000" style={{ width: `${result.confidence}%` }}></div>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                      <div className="flex items-center gap-2 text-teal-700 font-bold text-sm mb-2">
                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                         Medical Insight
                      </div>
                      <p className="text-slate-600 text-sm leading-relaxed">{result.insight}</p>
                    </div>
                    
                    <p className="text-center text-[10px] text-gray-400 italic mt-6">
                      Disclaimer: This is an AI-assisted analysis and not a substitute for professional medical advice.
                    </p>
                </div>

                <button onClick={() => setShowResult(false)} className="w-full py-3 border-2 border-gray-200 text-gray-600 font-bold rounded-md hover:bg-gray-50 transition">
                  Start New Assessment
                </button>
              </div>
            )}
          </div>
        </section>

        {/* ด้านขวา: ระบบแชตบอท */}
        <aside className="w-[400px] bg-white border-l border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-100 flex items-center gap-3">
            <div className="bg-teal-50 p-2 rounded-lg text-teal-600">🤖</div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Dr. AI Assistant</h3>
              <p className="text-xs text-slate-400">Always online • AI Powered</p>
            </div>
          </div>
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50/30">
            <div className="flex gap-2">
              <div className="bg-[#117b6f] text-white rounded-full h-8 w-8 flex items-center justify-center text-xs flex-shrink-0">✨</div>
              <div className="bg-white border border-gray-200 p-3 rounded-2xl rounded-tl-none text-sm text-slate-700 shadow-sm">
                {showResult 
                  ? `Based on the analysis, this looks like ${result.label}. Would you like to know about treatments?` 
                  : "Hello! I'm your Skin Health Assistant. Please upload a photo to start."}
              </div>
            </div>
          </div>
          <div className="p-4 border-t border-gray-100 bg-white">
            <div className="relative">
              <input type="text" placeholder="Type your question..." className="w-full bg-gray-50 border border-gray-200 rounded-full py-2.5 px-4 pr-12 text-sm focus:outline-none focus:border-teal-500" />
              <button className="absolute right-1 top-1 bottom-1 bg-[#117b6f] text-white px-3 rounded-full">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
              </button>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}