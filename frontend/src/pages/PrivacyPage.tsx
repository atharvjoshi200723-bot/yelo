import { Link } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="max-w-2xl mx-auto pb-24">
      <Link to="/" className="flex items-center gap-2 text-navy-400 hover:text-navy-600 mb-6 text-sm font-medium transition-colors">
        <ArrowLeft size={16} /> Back to YELO
      </Link>

      <div className="bg-white rounded-3xl shadow-soft p-6 sm:p-8 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-navy-900 rounded-2xl flex items-center justify-center">
            <Shield size={24} className="text-amber-400" />
          </div>
          <div>
            <h1 className="font-display text-2xl sm:text-3xl text-navy-900">Privacy Policy</h1>
            <p className="text-sm text-navy-400">Last updated: August 2026</p>
          </div>
        </div>

        <div className="prose prose-sm max-w-none text-navy-700 space-y-6">
          <p className="text-navy-500 italic">
            This Privacy Policy explains how YELO collects, uses, and protects your information. 
            This is an informational document, not a substitute for professional legal advice.
          </p>

          <section>
            <h2 className="font-display text-lg text-navy-900 mb-3">1. Information We Collect</h2>
            
            <h3 className="font-semibold text-navy-800 mb-2">Account Information</h3>
            <ul className="list-disc pl-5 space-y-1 mb-4">
              <li>Email address (used for login and communication)</li>
              <li>Password (stored securely, never visible to us)</li>
              <li>Date of birth (for age verification)</li>
              <li>Phone number (optional, for verification)</li>
            </ul>

            <h3 className="font-semibold text-navy-800 mb-2">Profile Information</h3>
            <ul className="list-disc pl-5 space-y-1 mb-4">
              <li>Name</li>
              <li>Profile photo</li>
              <li>Bio</li>
              <li>City</li>
              <li>College/university</li>
              <li>Interests</li>
            </ul>

            <h3 className="font-semibold text-navy-800 mb-2">Location Information</h3>
            <p className="mb-2">
              YELO uses location to help you discover nearby rentals, buddies, and communities.
            </p>
            <ul className="list-disc pl-5 space-y-1 mb-4">
              <li><strong>Approximate location</strong> (city/area) is shown publicly on your profile</li>
              <li><strong>Precise location</strong> may be used internally for radius-based discovery but is not publicly exposed</li>
              <li>You can control location sharing in your device settings</li>
            </ul>

            <h3 className="font-semibold text-navy-800 mb-2">Rental Listings</h3>
            <ul className="list-disc pl-5 space-y-1 mb-4">
              <li>Listing title, description, and photos</li>
              <li>Pricing and availability</li>
              <li>Approximate location (area name, not exact address)</li>
            </ul>

            <h3 className="font-semibold text-navy-800 mb-2">Buddy Profiles</h3>
            <ul className="list-disc pl-5 space-y-1 mb-4">
              <li>Profile title and description</li>
              <li>Activities you offer</li>
              <li>Pricing and availability</li>
              <li>Approximate location</li>
            </ul>

            <h3 className="font-semibold text-navy-800 mb-2">Messages</h3>
            <p className="mb-4">
              Messages between users are private. We do not read or share message content 
              except when reported for policy violations.
            </p>

            <h3 className="font-semibold text-navy-800 mb-2">Forum Content</h3>
            <p className="mb-4">
              Posts and comments in forums are public within your college community. 
              You can post anonymously if you prefer.
            </p>

            <h3 className="font-semibold text-navy-800 mb-2">Images</h3>
            <p className="mb-4">
              Photos you upload for listings, buddy profiles, and your avatar are stored 
              securely and served through YELO.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg text-navy-900 mb-3">2. How We Use Your Information</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>To provide and improve YELO services</li>
              <li>To connect you with nearby users, rentals, and buddies</li>
              <li>To process requests and transactions</li>
              <li>To send important notifications about your account</li>
              <li>To prevent fraud and enforce our guidelines</li>
              <li>To display relevant content in your feed</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-lg text-navy-900 mb-3">3. Data Visibility</h2>
            <p className="mb-2">What others can see:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Your name and profile photo</li>
              <li>Your city and college</li>
              <li>Your rental listings (if you create them)</li>
              <li>Your buddy profile (if you create one)</li>
              <li>Your forum posts (unless posted anonymously)</li>
            </ul>
            <p className="mt-3 text-sm text-navy-500">
              Your email, phone number, and exact location are never publicly visible.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg text-navy-900 mb-3">4. Your Controls</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Edit your profile information anytime</li>
              <li>Control your buddy profile visibility</li>
              <li>Pause or remove your buddy profile</li>
              <li>Delete your account</li>
              <li>Block other users</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-lg text-navy-900 mb-3">5. Account Deletion</h2>
            <p>
              You can request account deletion through your profile settings. 
              When you delete your account:
            </p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Your profile information is removed</li>
              <li>Your listings are deactivated</li>
              <li>Your buddy profile is removed</li>
              <li>Your messages remain in conversations with other users</li>
              <li>Some data may be retained for legal/safety purposes</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-lg text-navy-900 mb-3">6. Data Security</h2>
            <p>
              We use industry-standard security measures to protect your data. 
              However, no method of transmission over the internet is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg text-navy-900 mb-3">7. Changes to This Policy</h2>
            <p>
              We may update this policy from time to time. We will notify users of significant changes.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg text-navy-900 mb-3">8. Contact</h2>
            <p>
              For privacy-related questions, contact us through the YELO platform.
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
