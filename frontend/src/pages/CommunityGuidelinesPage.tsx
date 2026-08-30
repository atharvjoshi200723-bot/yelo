import { Link } from 'react-router-dom';
import { ArrowLeft, Users, Heart, ShieldAlert, Ban, AlertTriangle, MessageCircle } from 'lucide-react';

const GUIDELINES = [
  {
    icon: Heart,
    title: 'Be Respectful',
    color: 'bg-rose-50 text-rose-600',
    items: [
      'Treat others with kindness and respect',
      'Listen to different perspectives',
      'Avoid personal attacks or insults',
      'Respect boundaries and consent',
    ],
  },
  {
    icon: MessageCircle,
    title: 'Communicate Clearly',
    color: 'bg-navy-100 text-navy-600',
    items: [
      'Be honest in your listings and profiles',
      'Respond to messages promptly',
      'Clarify expectations before meeting',
      'Use the platform for communication',
    ],
  },
  {
    icon: ShieldAlert,
    title: 'No Harassment',
    color: 'bg-coral-50 text-coral-600',
    items: [
      'No bullying or intimidation',
      'No unwanted contact after being asked to stop',
      'No hate speech or discrimination',
      'No sexual harassment or inappropriate messages',
    ],
  },
  {
    icon: Ban,
    title: 'No Scams or Fraud',
    color: 'bg-amber-50 text-amber-600',
    items: [
      'Do not pretend to be someone you are not',
      'Do not offer services you cannot deliver',
      'Do not take payment without intention to fulfill',
      'Report suspicious activity',
    ],
  },
  {
    icon: AlertTriangle,
    title: 'No Illegal Activity',
    color: 'bg-red-50 text-red-600',
    items: [
      'No selling prohibited items',
      'No drug-related activity',
      'No violence or threats',
      'No sharing illegal content',
    ],
  },
  {
    icon: Users,
    title: 'Community First',
    color: 'bg-sage-50 text-sage-600',
    items: [
      'Help keep YELO safe for everyone',
      'Report rule violations',
      'Support fellow community members',
      'Contribute positively to forums',
    ],
  },
];

export default function CommunityGuidelinesPage() {
  return (
    <div className="max-w-2xl mx-auto pb-24">
      <Link to="/" className="flex items-center gap-2 text-navy-400 hover:text-navy-600 mb-6 text-sm font-medium transition-colors">
        <ArrowLeft size={16} /> Back to YELO
      </Link>

      <div className="bg-white rounded-3xl shadow-soft p-6 sm:p-8 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-navy-900 rounded-2xl flex items-center justify-center">
            <Users size={24} className="text-amber-400" />
          </div>
          <div>
            <h1 className="font-display text-2xl sm:text-3xl text-navy-900">Community Guidelines</h1>
            <p className="text-sm text-navy-400">Building a safe, respectful community</p>
          </div>
        </div>

        <p className="text-navy-600 mb-6">
          YELO is a community of real people helping each other. These guidelines help 
          keep the platform safe and enjoyable for everyone.
        </p>

        <div className="space-y-6">
          {GUIDELINES.map((guideline, i) => (
            <div key={i} className="border-b border-navy-100/30 pb-6 last:border-0 last:pb-0">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${guideline.color}`}>
                  <guideline.icon size={20} />
                </div>
                <h2 className="font-display text-lg text-navy-900">{guideline.title}</h2>
              </div>
              <ul className="list-disc pl-5 space-y-1 text-sm text-navy-600">
                {guideline.items.map((item, j) => (
                  <li key={j}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-5 mb-6">
        <h3 className="font-display text-lg text-navy-900 mb-2">Reporting Violations</h3>
        <p className="text-sm text-navy-600">
          If you see behavior that violates these guidelines, please report it using the 
          report button on profiles, listings, or posts. Our moderation team reviews all reports.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-soft p-5">
        <h3 className="font-display text-lg text-navy-900 mb-2">Consequences</h3>
        <p className="text-sm text-navy-600 mb-3">
          Violations may result in:
        </p>
        <ul className="list-disc pl-5 space-y-1 text-sm text-navy-600">
          <li>Content removal</li>
          <li>Account warnings</li>
          <li>Temporary suspension</li>
          <li>Permanent ban for serious violations</li>
        </ul>
      </div>
    </div>
  );
}
