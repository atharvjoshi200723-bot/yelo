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
          <h1 className="font-display text-display-lg text-navy-900">Linkup</h1>
          <p className="text-sm text-navy-400 mt-1">
            Create a plan and share it with your community.
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-navy-50 rounded-xl transition-colors"
          aria-label="Close"
        >
          <X size={20} className="text-navy-400" />
        </button>
      </div>

      {/* Present the full Linkup interface */}
      <div className="space-y-4">
        <button
          onClick={() => setOpenCreate(true)}
          className="w-full py-3 bg-navy-900 text-cream-50 rounded-xl font-medium hover:bg-navy-800 transition-all duration-200 btn-press flex items-center justify-center gap-2"
        >
          Create Linkup
        </button>

        <p className="text-sm text-navy-400 text-center">
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
