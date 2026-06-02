import { X, Globe, User, Phone, CheckCircle2, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState } from 'react';

interface BecomeHostModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BecomeHostModal({ isOpen, onClose }: BecomeHostModalProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    experience: 'Beginner',
    location: 'Lagos'
  });

  const nextStep = () => setStep(s => s + 1);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Overlay */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-dark/60 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-2xl bg-white rounded-3xl overflow-hidden shadow-2xl"
          >
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 p-2 rounded-full border border-gray-100 hover:bg-gray-50 transition-colors z-10"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>

            <div className="flex flex-col md:flex-row h-full">
              {/* Sidebar */}
              <div className="w-full md:w-64 bg-teal p-8 text-white">
                <div className="flex items-center gap-2 mb-12">
                  <Globe className="w-6 h-6" />
                  <span className="font-display font-bold text-lg">Lagos Rhythm</span>
                </div>
                
                <h3 className="text-2xl font-bold mb-4 font-display">Share your world with the world.</h3>
                <p className="text-teal-100 text-sm leading-relaxed mb-12">
                  Become a virtual host and earn by showcasing the beauty of Lagos to thousands of explorers.
                </p>

                <div className="space-y-6">
                  {[
                    { s: 1, t: 'Basic Info' },
                    { s: 2, t: 'Experience' },
                    { s: 3, t: 'Verification' }
                  ].map(item => (
                    <div key={item.s} className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] font-bold ${step >= item.s ? 'bg-white text-teal border-white' : 'border-teal-400 text-teal-400'}`}>
                        {step > item.s ? <CheckCircle2 className="w-4 h-4" /> : item.s}
                      </div>
                      <span className={`text-xs font-bold ${step >= item.s ? 'text-white' : 'text-teal-400'}`}>{item.t}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Form Content */}
              <div className="flex-1 p-8 md:p-12 overflow-y-auto max-h-[80vh]">
                {step === 1 && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                    <h4 className="text-xl font-bold font-display">Let's start with the basics.</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">First Name</label>
                        <div className="relative">
                           <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                           <input 
                            type="text" 
                            className="w-full bg-gray-50 border border-gray-100 rounded-xl pl-10 pr-4 py-3 text-sm focus:bg-white focus:border-teal outline-none transition-all"
                            placeholder="John" 
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Last Name</label>
                        <input 
                          type="text" 
                          className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm focus:bg-white focus:border-teal outline-none transition-all" 
                          placeholder="Doe"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Phone Number</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input 
                          type="tel" 
                          className="w-full bg-gray-50 border border-gray-100 rounded-xl pl-10 pr-4 py-3 text-sm focus:bg-white focus:border-teal outline-none transition-all"
                          placeholder="+234 800 000 0000" 
                        />
                      </div>
                    </div>
                    
                    <button 
                      onClick={nextStep}
                      className="w-full bg-dark text-white py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-neutral-800 transition-colors"
                    >
                      Continue
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                    <h4 className="text-xl font-bold font-display">Tell us about your experience.</h4>
                    <div className="space-y-3">
                      {['I am a certified tour guide', 'I am a local enthusiast', 'I am an expert in history/culture'].map(opt => (
                        <button key={opt} className="w-full p-4 text-left border border-gray-100 rounded-xl hover:border-teal hover:bg-teal/[0.02] flex items-center justify-between group transition-all">
                          <span className="text-sm font-medium text-gray-600 group-hover:text-teal">{opt}</span>
                          <div className="w-4 h-4 rounded-full border-2 border-gray-200 group-hover:border-teal" />
                        </button>
                      ))}
                    </div>
                    <button 
                      onClick={nextStep}
                      className="w-full bg-dark text-white py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-neutral-800 transition-colors"
                    >
                      Continue
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="text-center py-8">
                    <div className="w-20 h-20 rounded-full bg-teal/10 flex items-center justify-center mx-auto mb-6 text-4xl">
                      OK
                    </div>
                    <h4 className="text-2xl font-bold font-display mb-2">Application Received!</h4>
                    <p className="text-sm text-gray-500 mb-8 max-w-xs mx-auto">
                      Our team will review your information and get back to you within 48 hours.
                    </p>
                    <button 
                      onClick={onClose}
                      className="bg-dark text-white px-12 py-3 rounded-xl font-bold text-sm hover:bg-neutral-800 transition-colors"
                    >
                      Back to Exploring
                    </button>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
