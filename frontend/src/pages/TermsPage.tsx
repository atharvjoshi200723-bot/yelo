import { Link } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="max-w-2xl mx-auto pb-24">
      <Link to="/" className="flex items-center gap-2 text-navy-400 hover:text-navy-600 mb-6 text-sm font-medium transition-colors">
        <ArrowLeft size={16} /> Back to YELO
      </Link>

      <div className="bg-white rounded-3xl shadow-soft p-6 sm:p-8 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-navy-900 rounded-2xl flex items-center justify-center">
            <FileText size={24} className="text-amber-400" />
          </div>
          <div>
            <h1 className="font-display text-2xl sm:text-3xl text-navy-900">Terms of Service</h1>
            <p className="text-sm text-navy-400">Last updated: August 2026</p>
          </div>
        </div>

        <div className="prose prose-sm max-w-none text-navy-700 space-y-6">
          <p className="text-navy-500 italic">
            These terms govern your use of YELO. This is an informational document, 
            not a substitute for professional legal advice.
          </p>

          <section>
            <h2 className="font-display text-lg text-navy-900 mb-3">1. Acceptance of Terms</h2>
            <p>
              By using YELO, you agree to these terms. If you do not agree, 
              please do not use the platform.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg text-navy-900 mb-3">2. User Responsibilities</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>You must be at least 16 years old to create an account</li>
              <li>You must provide accurate information</li>
              <li>You are responsible for your account security</li>
              <li>You must not share your account with others</li>
              <li>You must comply with all applicable laws</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-lg text-navy-900 mb-3">3. Marketplace Behavior</h2>
            <p className="mb-2">When using YELO's rental marketplace:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Describe items accurately</li>
              <li>Honor agreed-upon prices and terms</li>
              <li>Communicate promptly and respectfully</li>
              <li>Return items in the condition agreed upon</li>
              <li>Report any issues through the platform</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-lg text-navy-900 mb-3">4. User-Generated Content</h2>
            <p className="mb-2">You retain ownership of content you create on YELO. By posting, you:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Grant YELO a license to display your content on the platform</li>
              <li>Confirm you have the right to share the content</li>
              <li>Accept responsibility for your posts</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-lg text-navy-900 mb-3">5. Prohibited Behavior</h2>
            <p className="mb-2">The following are not allowed on YELO:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Harassment, bullying, or threats</li>
              <li>Scams or fraudulent activity</li>
              <li>Spam or misleading content</li>
              <li>Impersonating others</li>
              <li>Sharing illegal content</li>
              <li>Sexual services or explicit content</li>
              <li>Circumventing platform rules</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-lg text-navy-900 mb-3">6. Account Restrictions</h2>
            <p>
              YELO reserves the right to suspend or terminate accounts that violate these terms. 
              This may happen without prior notice for serious violations.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg text-navy-900 mb-3">7. Moderation</h2>
            <p>
              YELO moderates content to maintain community safety. We may remove content 
              or restrict accounts that violate our community guidelines.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg text-navy-900 mb-3">8. Platform Limitations</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>YELO is not a party to user transactions</li>
              <li>We do not guarantee the quality of listings</li>
              <li>We are not responsible for user conduct</li>
              <li>Services are provided "as available"</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-lg text-navy-900 mb-3">9. Disputes</h2>
            <p>
              Users are encouraged to resolve disputes directly. YELO may assist with 
              communication but cannot force resolution. For serious issues, 
              please contact local authorities.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg text-navy-900 mb-3">10. Changes to Terms</h2>
            <p>
              We may update these terms from time to time. Continued use of YELO 
              constitutes acceptance of updated terms.
            </p>
          </section>
        </div>
      </div>

      <div className="text-center text-xs text-navy-400">
        <p>This is an informational document, not legal advice.</p>
      </div>
    </div>
  );
}
