import React, { useState, useRef } from 'react';
import { Camera, Upload, Loader2, CheckCircle, AlertTriangle, Info, Search } from 'lucide-react';
import { extractReceiptData, generateEmbedding, getProactiveAdvice } from '../services/geminiService';
import { findSimilarExpenses, createEmbeddingText } from '../services/vectorService';
import { Expense, SimilarityResult, AnalysisResult } from '../types';

interface ScannerProps {
  onSave: (expense: Expense) => void;
  history: Expense[];
  onCancel: () => void;
}

const Scanner: React.FC<ScannerProps> = ({ onSave, history, onCancel }) => {
  const [step, setStep] = useState<'upload' | 'analyzing' | 'review'>('upload');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setImagePreview(base64);
        processImage(base64.split(',')[1]); // Remove data:image/jpeg;base64,
      };
      reader.readAsDataURL(file);
    }
  };

  const processImage = async (base64Data: string) => {
    setStep('analyzing');
    try {
      // 1. Extract Data
      const extracted = await extractReceiptData(base64Data);
      
      // 2. Generate Embedding for the new item (Merchant + Category)
      // This is crucial for the "Search" part of the prompt requirements
      const searchText = createEmbeddingText(
        extracted.merchant || '', 
        extracted.category || '', 
        extracted.items
      );
      const embedding = await generateEmbedding(searchText);
      
      // 3. Find Semantic Matches (Simulating FAISS)
      const similar = findSimilarExpenses(embedding, history);

      // 4. Get Proactive Advice
      const adviceResult = await getProactiveAdvice(extracted, similar.map(s => s.expense));

      setAnalysis({
        extractedData: { ...extracted, embedding }, // Keep embedding for saving later
        advisory: adviceResult.advice,
        similarExpenses: similar.map(s => s.expense),
        sentiment: adviceResult.sentiment
      });
      setStep('review');
    } catch (error) {
      console.error(error);
      alert("Failed to analyze receipt. Please try again.");
      setStep('upload');
    }
  };

  const handleSave = () => {
    if (analysis && analysis.extractedData) {
      const newExpense: Expense = {
        id: crypto.randomUUID(),
        merchant: analysis.extractedData.merchant || 'Unknown',
        amount: analysis.extractedData.amount || 0,
        currency: analysis.extractedData.currency || 'USD',
        date: analysis.extractedData.date || new Date().toISOString().split('T')[0],
        category: analysis.extractedData.category || 'Uncategorized',
        tax: analysis.extractedData.tax,
        items: analysis.extractedData.items,
        embedding: analysis.extractedData.embedding, // Store the vector!
        receiptImage: imagePreview || undefined
      };
      onSave(newExpense);
    }
  };

  if (step === 'upload') {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[500px] border-2 border-dashed border-slate-700 rounded-2xl bg-slate-800/50 p-10 animate-fade-in">
        <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mb-6">
          <Camera className="w-10 h-10 text-blue-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Scan Receipt</h2>
        <p className="text-slate-400 mb-8 text-center max-w-md">
          Upload or take a photo of your receipt. VisualFin will extract details and compare prices automatically.
        </p>
        
        <div className="flex gap-4">
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-medium flex items-center gap-2 transition-all"
          >
            <Upload className="w-5 h-5" />
            Upload Image
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*"
            onChange={handleFileChange}
          />
        </div>
      </div>
    );
  }

  if (step === 'analyzing') {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[500px] bg-slate-900 rounded-2xl p-10 text-center animate-pulse">
        <Loader2 className="w-16 h-16 text-blue-500 animate-spin mb-6" />
        <h3 className="text-xl font-semibold text-white mb-2">Analyzing Receipt...</h3>
        <p className="text-slate-400 max-w-xs">
          Identifying merchant, extracting line items, and performing semantic search on your history.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in pb-20">
      {/* Left: Receipt & Form */}
      <div className="space-y-6">
        <div className="relative h-64 w-full bg-black rounded-2xl overflow-hidden border border-slate-700">
          <img src={imagePreview!} alt="Receipt" className="w-full h-full object-contain opacity-80" />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
            <span className="text-xs font-mono text-emerald-400 bg-emerald-900/50 px-2 py-1 rounded">
              GEMINI-3-FLASH-PREVIEW ANALYZED
            </span>
          </div>
        </div>

        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">Extracted Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Merchant</label>
              <input 
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
                value={analysis?.extractedData.merchant || ''} 
                readOnly 
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Amount</label>
              <input 
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                value={analysis?.extractedData.amount || ''} 
                readOnly 
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Date</label>
              <input 
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
                value={analysis?.extractedData.date || ''} 
                readOnly 
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Category</label>
              <input 
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
                value={analysis?.extractedData.category || ''} 
                readOnly 
              />
            </div>
          </div>
        </div>
      </div>

      {/* Right: AI Insights & Semantic Search Results */}
      <div className="space-y-6">
        
        {/* Proactive Advisory Card */}
        <div className={`p-6 rounded-2xl border ${
          analysis?.sentiment === 'warning' ? 'bg-orange-900/20 border-orange-500/50' : 
          analysis?.sentiment === 'positive' ? 'bg-emerald-900/20 border-emerald-500/50' : 
          'bg-blue-900/20 border-blue-500/50'
        }`}>
          <div className="flex items-center gap-3 mb-4">
            {analysis?.sentiment === 'warning' ? <AlertTriangle className="text-orange-500" /> : <Info className="text-blue-500" />}
            <h3 className="text-lg font-semibold text-white">Gemini Financial Analyst</h3>
          </div>
          <ul className="space-y-3">
            {analysis?.advisory.map((tip, idx) => (
              <li key={idx} className="flex gap-3 text-slate-200 text-sm leading-relaxed">
                <span className="text-blue-500 font-bold">•</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>

        {/* Semantic Search Results (The "FAISS" part) */}
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
          <div className="flex items-center gap-2 mb-4">
            <Search className="w-5 h-5 text-purple-400" />
            <h3 className="text-lg font-semibold text-white">Semantic History Comparison</h3>
          </div>
          <p className="text-xs text-slate-500 mb-4">
            Powered by text-embedding-004 & Cosine Similarity
          </p>
          
          <div className="space-y-3">
            {analysis?.similarExpenses.length === 0 ? (
              <p className="text-slate-500 text-sm">No similar historical expenses found.</p>
            ) : (
              analysis?.similarExpenses.map((exp) => (
                <div key={exp.id} className="flex justify-between items-center p-3 bg-slate-900 rounded-lg border border-slate-700">
                  <div>
                    <p className="text-white font-medium">{exp.merchant}</p>
                    <p className="text-xs text-slate-400">{exp.date}</p>
                  </div>
                  <div className="text-right">
                     <span className={`text-sm font-bold ${
                        (analysis?.extractedData.amount || 0) > exp.amount ? 'text-red-400' : 'text-emerald-400'
                     }`}>
                        {exp.currency} {exp.amount.toFixed(2)}
                     </span>
                     <p className="text-[10px] text-slate-500">Vector Match</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex gap-4 pt-4">
          <button 
            onClick={onCancel}
            className="flex-1 py-3 px-4 rounded-xl border border-slate-600 text-slate-300 hover:bg-slate-800 transition-colors"
          >
            Discard
          </button>
          <button 
            onClick={handleSave}
            className="flex-1 py-3 px-4 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-500 transition-colors flex justify-center items-center gap-2"
          >
            <CheckCircle className="w-5 h-5" />
            Confirm & Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default Scanner;
