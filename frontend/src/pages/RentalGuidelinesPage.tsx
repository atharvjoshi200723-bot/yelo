import { Link } from 'react-router-dom';
import { ArrowLeft, Package, CheckCircle, AlertCircle, MapPin, MessageCircle, DollarSign } from 'lucide-react';

const SECTIONS = [
  {
    icon: CheckCircle,
    title: 'Listing Accuracy',
    color: 'bg-sage-50 text-sage-600',
    content: [
      'Describe your item honestly and completely',
      'Include any defects or wear',
      'Use real photos of the actual item',
      'Set accurate pricing',
      'Specify true availability',
    ],
  },
  {
    icon: Package,
    title: 'Item Condition',
    color: 'bg-navy-100 text-navy-600',
    content: [
      'Clean items before lending',
      'Ensure items are in working condition',
      'Include all accessories mentioned',
      'Document item condition with photos',
      'Agree on condition at pickup',
    ],
  },
  {
    icon: MapPin,
    title: 'Pickup & Return',
    color: 'bg-amber-50 text-amber-600',
    content: [
      'Meet in safe, public locations',
      'Confirm pickup/return times',
      'Check item condition together',
      'Return items on time',
      'Report any issues immediately',
    ],
  },
  {
    icon: DollarSign,
    title: 'Pricing Agreements',
    color: 'bg-coral-50 text-coral-600',
    content: [
      'Agree on price before the rental',
      'Clarify what is included in the price',
      'Discuss deposit if applicable',
      'Use the platform for payment agreements',
      'Keep communication in the chat',
    ],
  },
  {
    icon: MessageCircle,
    title: 'Communication',
    color: 'bg-navy-100 text-navy-600',
    content: [
      'Respond to messages promptly',
      'Be clear about expectations',
      'Keep conversations respectful',
      'Use YELO messaging for records',
      'Confirm details before meeting',
    ],
  },
  {
    icon: AlertCircle,
    title: 'Disputes',
    color: 'bg-red-50 text-red-600',
    content: [
      'Try to resolve issues directly',
      'Document any problems',
      'Report serious issues to YELO',
      'Be honest about what happened',
      'Seek local authorities if needed',
    ],
  },
];

export default function RentalGuidelinesPage() {
  return (
    <div className="max-w-2xl mx-auto pb-24">
      <Link to="/" className="flex items-center gap-2 text-navy-400 hover:text-navy-600 mb-6 text-sm font-medium transition-colors">
        <ArrowLeft size={16} /> Back to YELO
      </Link>

      <div className="bg-white rounded-3xl shadow-soft p-6 sm:p-8 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-navy-900 rounded-2xl flex items-center justify-center">
            <Package size={24} className="text-amber-400" />
          </div>
          <div>
            <h1 className="font-display text-2xl sm:text-3xl text-navy-900">Rental Guidelines</h1>
            <p className="text-sm text-navy-400">Tips for safe, successful rentals</p>
          </div>
        </div>

        <p className="text-navy-600 mb-6">
          Following these guidelines helps ensure positive rental experiences for everyone on YELO.
        </p>

        <div className="space-y-6">
          {SECTIONS.map((section, i) => (
            <div key={i} className="border-b border-navy-100/30 pb-6 last:border-0 last:pb-0">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${section.color}`}>
                  <section.icon size={20} />
                </div>
                <h2 className="font-display text-lg text-navy-900">{section.title}</h2>
              </div>
              <ul className="list-disc pl-5 space-y-1 text-sm text-navy-600">
                {section.content.map((item, j) => (
                  <li key={j}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-5 mb-6">
        <h3 className="font-display text-lg text-navy-900 mb-2">Safety Tips</h3>
        <ul className="list-disc pl-5 space-y-1 text-sm text-navy-600">
          <li>Always meet in public places</li>
          <li>Tell a friend where you are going</li>
          <li>Trust your instincts</li>
          <li>Use YELO's messaging for records</li>
          <li>Report suspicious activity</li>
        </ul>
      </div>

      <div className="bg-white rounded-2xl shadow-soft p-5">
        <h3 className="font-display text-lg text-navy-900 mb-2">Prohibited Items</h3>
        <p className="text-sm text-navy-600 mb-3">
          The following items should not be listed on YELO:
        </p>
        <ul className="list-disc pl-5 space-y-1 text-sm text-navy-600">
          <li>Weapons or dangerous items</li>
          <li>Illegal substances</li>
          <li>Counterfeit goods</li>
          <li>Items that violate local laws</li>
          <li>Adult content or services</li>
        </ul>
      </div>
    </div>
  );
}
