import { useState } from 'react';
import { CreatePlanModal, PlanFormValues } from '../components/plans/CreatePlanModal';
import { X } from 'lucide-react';

interface LinkupPageProps {
  onClose: () => void;
}

export default function LinkupPage({ onClose }: LinkupPageProps) {
  const [openCreate, setOpenCreate] = useState(false);

  return (
    <div className="max-w-lg mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display font-black text-2xl text-[#1B1250]">Linkup</h1>
          <p className="text-sm font-bold text-[#1B1250]/50 mt-1">
            Create a plan and share it with your community.
          </p>
        </div>
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-[#F6FBD4] border-3 border-[#1B1250] shadow-[4px_5px_0_#1B1250] flex items-center justify-center transition-all active:translate-y-[2px] active:shadow-none"
          aria-label="Close"
        >
          <X size={18} className="text-[#1B1250]" />
        </button>
      </div>

      {/* Present the full Linkup interface */}
      <div className="space-y-4">
        <button
          onClick={() => setOpenCreate(true)}
          className="w-full py-3 bg-[#C5F030] text-[#1B1250] border-3 border-[#1B1250] shadow-[4px_5px_0_#1B1250] rounded-full font-display font-black uppercase tracking-wide transition-all active:translate-y-[2px] active:shadow-none flex items-center justify-center gap-2"
        >
          Create Linkup
        </button>

        <p className="text-sm font-bold text-[#1B1250]/40 text-center">
          This is the Linkup interface. Use the button above to open the full create plan form.
        </p>
      </div>

      {/* Reuse the existing Create Plan modal as the full create interface */}
      {openCreate && (
        <CreatePlanModal onClose={() => setOpenCreate(false)} />
      )}
    </div>
  );
}
