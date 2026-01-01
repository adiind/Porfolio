import React from 'react';
import { motion } from 'framer-motion';
import { X, Download, ExternalLink } from 'lucide-react';

interface Props {
    onClose: () => void;
    resumeUrl: string;
}

const ResumeModal: React.FC<Props> = ({ onClose, resumeUrl }) => {
    const handleDownload = async () => {
        try {
            const response = await fetch(resumeUrl);
            if (!response.ok) throw new Error('Network response was not ok');

            const arrayBuffer = await response.arrayBuffer();
            const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'Adi_resume.pdf';
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();

            // Cleanup
            setTimeout(() => {
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
            }, 100);
        } catch (error) {
            console.error('Error downloading resume:', error);
            alert('Could not download the resume. Opening in new tab instead.');
            window.open(resumeUrl, '_blank');
        }
    };

    const handleOpenInNewTab = () => {
        window.open(resumeUrl, '_blank');
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] flex items-center justify-center p-4 md:p-8 bg-black/95 backdrop-blur-xl"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-5xl h-[90vh] bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-black/50">
                    <h2 className="text-lg font-semibold text-white">Resume</h2>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleOpenInNewTab}
                            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded-lg transition-all border border-white/10 text-sm"
                            title="Open in new tab"
                        >
                            <ExternalLink size={16} />
                            <span className="hidden sm:inline">Open in Tab</span>
                        </button>
                        <button
                            onClick={handleDownload}
                            className="flex items-center gap-2 px-4 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 hover:text-rose-300 rounded-lg transition-all border border-rose-500/30 text-sm font-medium"
                        >
                            <Download size={16} />
                            <span>Download PDF</span>
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-white/50 hover:text-white transition-colors"
                            title="Close"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* PDF Viewer */}
                <div className="flex-1 w-full overflow-hidden bg-gray-900">
                    <iframe
                        src={`${resumeUrl}#toolbar=0&navpanes=0&scrollbar=1`}
                        className="w-full h-full border-0"
                        title="Resume PDF Viewer"
                    />
                </div>

                {/* Mobile Download CTA */}
                <div className="sm:hidden p-4 border-t border-white/10 bg-black/50">
                    <button
                        onClick={handleDownload}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-lg transition-all font-medium"
                    >
                        <Download size={18} />
                        <span>Download Resume</span>
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default ResumeModal;
